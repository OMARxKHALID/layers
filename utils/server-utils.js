import { writeFile, readFile, unlink, mkdir, readdir, stat } from "fs/promises";
import { existsSync, createWriteStream } from "fs";
import { join, basename } from "path";
import { tmpdir } from "os";
import archiver from "archiver";
import { pipeline } from "stream/promises";
import { ConverterFactory } from "../lib/converters";

export const TEMP_DIR = join(tmpdir(), "layers_data");
export const UPLOAD_DIR = join(TEMP_DIR, "uploads");
export const OUTPUT_DIR = join(TEMP_DIR, "outputs");
export const JOBS_DIR = join(TEMP_DIR, "jobs");

const CLEANUP_MAX_AGE = 60 * 60 * 1000;

// Store active processes for cancellation
const activeProcesses = new Map();

// --- Queue Management ---
const jobQueue = [];
let activeJobCount = 0;
const MAX_CONCURRENT_JOBS = 2; // Reduced slightly for better stability
let isInitialized = false;

export async function ensureDirs() {
  await Promise.all([
    !existsSync(UPLOAD_DIR) && mkdir(UPLOAD_DIR, { recursive: true }),
    !existsSync(OUTPUT_DIR) && mkdir(OUTPUT_DIR, { recursive: true }),
    !existsSync(JOBS_DIR) && mkdir(JOBS_DIR, { recursive: true }),
  ]);
}

export async function saveJob(job) {
  // Don't save transient internal properties like onCommand
  const { onCommand, ...serializableJob } = job;
  await writeFile(
    join(JOBS_DIR, `${job.id}.json`),
    JSON.stringify(serializableJob),
  );
}

// Helper to wait
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getJob(id) {
  const filePath = join(JOBS_DIR, `${id}.json`);
  const legacyFilePath = join(tmpdir(), "morpho_data", "jobs", `${id}.json`);

  // Retry logic for potential race conditions
  for (let i = 0; i < 3; i++) {
    try {
      if (existsSync(filePath)) {
        return JSON.parse(await readFile(filePath, "utf-8"));
      }
      // Fallback for transition period
      if (existsSync(legacyFilePath)) {
        return JSON.parse(await readFile(legacyFilePath, "utf-8"));
      }
    } catch {
      // Ignore error and retry
    }
    if (i < 2) await sleep(100);
  }
  return null;
}

export async function cancelJob(id) {
  // 1. Remove from queue if pending
  const queueIndex = jobQueue.findIndex((j) => j === id); // Fix: jobQueue is array of IDs
  if (queueIndex !== -1) {
    jobQueue.splice(queueIndex, 1);
    const job = await getJob(id);
    if (job) {
      job.status = "cancelled";
      await saveJob(job);
    }
    return true;
  }

  // 2. Handle active process
  const proc = activeProcesses.get(id);
  if (proc) {
    if (proc.kill) proc.kill("SIGTERM");
    else if (proc.abort) proc.abort();
    activeProcesses.delete(id);
  }

  // 3. Mark as cancelled in DB regardless
  // This ensures that even if the process finishes purely by timing,
  // the final check in triggerNextJob will see it was cancelled.
  const job = await getJob(id);
  if (job) {
    job.status = "cancelled";
    await saveJob(job);
    return true;
  }

  return false;
}

export async function runCleanup() {
  const dirs = [UPLOAD_DIR, OUTPUT_DIR, JOBS_DIR];
  const now = Date.now();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    try {
      const files = await readdir(dir);
      await Promise.all(
        files.map(async (file) => {
          try {
            const path = join(dir, file);
            const { mtimeMs } = await stat(path);
            if (now - mtimeMs > CLEANUP_MAX_AGE) await unlink(path);
          } catch {}
        }),
      );
    } catch {}
  }
}

export async function processJob(job, settings) {
  job.settings = settings;
  await saveJob(job);
  jobQueue.push(job.id);
  triggerNextJob();
}

export async function restoreQueue() {
  if (isInitialized) return;
  await ensureDirs();

  try {
    const files = await readdir(JOBS_DIR);
    const pendingJobs = [];

    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const job = JSON.parse(await readFile(join(JOBS_DIR, file), "utf-8"));
        // If it was pending or processing (interrupted), re-queue it
        if (job.status === "pending" || job.status === "processing") {
          // Reset status to pending so it can be picked up safely
          job.status = "pending";
          job.progress = 0;
          await saveJob(job);
          pendingJobs.push(job);
        }
      } catch {}
    }

    // Sort by creation time to maintain order
    pendingJobs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    for (const job of pendingJobs) {
      jobQueue.push(job.id);
    }

    console.log(`Restored ${pendingJobs.length} jobs from disk.`);
    isInitialized = true;
    triggerNextJob();
  } catch (err) {
    console.error("Queue restoration failed:", err);
  }
}

async function triggerNextJob() {
  if (activeJobCount >= MAX_CONCURRENT_JOBS || jobQueue.length === 0) return;

  activeJobCount++;
  const jobId = jobQueue.shift();
  const job = await getJob(jobId);

  if (!job || job.status === "cancelled") {
    activeJobCount--;
    triggerNextJob();
    return;
  }

  const settings = job.settings || {};

  try {
    job.status = "processing";
    job.progress = 5;
    await saveJob(job);

    const converter = ConverterFactory.getConverter(
      job.inputFile,
      job.targetExt,
    );

    // Add hook to capture process for cancellation
    job.onCommand = (proc) => {
      activeProcesses.set(job.id, proc);
    };

    const result = await converter.convert(job, settings, async (p) => {
      // Optimistic progress update, but check cancel status periodically if needed
      // (Optimization: In a real heavy app we'd check DB here, but let's rely on final check)
      job.progress = p;
      await saveJob(job);
    });

    activeProcesses.delete(job.id);

    // CRITICAL FIX: Reload job from disk to check if it was cancelled externally
    // while we were awaiting the conversion.
    const freshJob = await getJob(job.id);
    if (freshJob && freshJob.status === "cancelled") {
      // It was cancelled! Do not overwrite with success.
      // Cleanup any partial outputs
      if (result && result.outputFiles) {
        for (const f of result.outputFiles) await unlink(f).catch(() => {});
      } else {
        await unlink(job.outputFile).catch(() => {});
      }
      // job is already saved as cancelled by cancelJob
    } else if (result === "cancelled") {
      // Internal cancellation detection (e.g. ffmpeg error)
      job.status = "cancelled";
      job.progress = 0;
      await saveJob(job);
    } else {
      // Handle multi-file results (zip them)
      if (result && result.outputFiles && result.outputFiles.length > 1) {
        // Update job to be a zip
        job.targetExt = "zip";
        const newOutputPath = job.outputFile.replace(/\.[^.]+$/, ".zip");
        job.outputFile = newOutputPath;

        const outputStream = createWriteStream(newOutputPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        const zipFinished = new Promise((resolve, reject) => {
          outputStream.on("close", resolve);
          archive.on("error", reject);
        });

        archive.pipe(outputStream);

        for (const filePath of result.outputFiles) {
          archive.file(filePath, { name: basename(filePath) });
        }

        await archive.finalize();
        await zipFinished;

        // Cleanup individual files
        for (const filePath of result.outputFiles) {
          await unlink(filePath).catch(() => {});
        }
      }

      job.progress = 100;
      job.status = "done";
      await saveJob(job);
    }

    // Cleanup input
    await unlink(job.inputFile).catch(() => {});
  } catch (error) {
    activeProcesses.delete(job.id);

    // Check if cancellation happened during error
    const freshJob = await getJob(job.id);
    if (freshJob && freshJob.status === "cancelled") {
      // Ignore error, it was cancelled
    } else {
      job.status = "error";
      job.error = error.message;
      await saveJob(job);
    }
  } finally {
    activeJobCount--;
    triggerNextJob();
  }
}
