import { writeFile, readFile, unlink, mkdir, readdir, stat } from "fs/promises";
import { existsSync, createWriteStream } from "fs";
import { join, basename } from "path";
import { tmpdir, cpus } from "os";
import archiver from "archiver";
import { ConverterFactory } from "../lib/converters";
import { logger } from "../lib/logger";

export const TEMP_DIR = join(tmpdir(), "layers_data");
export const UPLOAD_DIR = join(TEMP_DIR, "uploads");
export const OUTPUT_DIR = join(TEMP_DIR, "outputs");
export const JOBS_DIR = join(TEMP_DIR, "jobs");

const CLEANUP_MAX_AGE = 60 * 60 * 1000;
const MAX_CONCURRENT_JOBS = Math.max(1, cpus().length - 1);
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 100;

const activeProcesses = new Map();
const jobCache = new Map();
const jobQueue = [];
let activeJobCount = 0;
let isInitialized = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function ensureDirs() {
  await Promise.all([
    mkdir(UPLOAD_DIR, { recursive: true }),
    mkdir(OUTPUT_DIR, { recursive: true }),
    mkdir(JOBS_DIR, { recursive: true }),
  ]);
}

export async function saveJob(job) {
  // Strip non-serializable objects before caching and saving
  const { onCommand, ...serializableJob } = job;
  const jobCopy = JSON.parse(JSON.stringify(serializableJob));

  jobCache.set(job.id, jobCopy);

  try {
    await writeFile(join(JOBS_DIR, `${job.id}.json`), JSON.stringify(jobCopy));
  } catch (err) {
    logger.error(`Failed to save job ${job.id} to disk`, err);
  }
}

export async function getJob(id) {
  // Check cache first
  if (jobCache.has(id)) {
    return JSON.parse(JSON.stringify(jobCache.get(id)));
  }

  const filePath = join(JOBS_DIR, `${id}.json`);
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      if (!existsSync(filePath)) return null;
      const content = await readFile(filePath, "utf-8");
      const job = JSON.parse(content);

      // Cache terminal jobs for a short time or active jobs
      jobCache.set(id, job);
      return job;
    } catch (e) {
      if (e.code === "ENOENT") return null;
      if (attempt < RETRY_ATTEMPTS - 1) await sleep(RETRY_DELAY);
    }
  }
  return null;
}

export async function cancelJob(id) {
  const queueIndex = jobQueue.indexOf(id);
  if (queueIndex !== -1) {
    jobQueue.splice(queueIndex, 1);
  }

  const proc = activeProcesses.get(id);
  if (proc) {
    try {
      if (proc.kill) proc.kill("SIGTERM");
      else if (proc.abort) proc.abort();
    } catch (e) {
      logger.warn(`Failed to kill process for job ${id}`, e);
    }
    activeProcesses.delete(id);
  }

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
      await Promise.allSettled(
        files.map(async (file) => {
          const path = join(dir, file);
          const { mtimeMs } = await stat(path);
          if (now - mtimeMs > CLEANUP_MAX_AGE) {
            await unlink(path);
            // Also remove from cache if it's a job file
            if (dir === JOBS_DIR && file.endsWith(".json")) {
              jobCache.delete(file.replace(".json", ""));
            }
          }
        }),
      );
    } catch (err) {
      logger.error(`Cleanup failed for directory ${dir}`, err);
    }
  }
}

export async function processJob(job, settings) {
  job.settings = settings;
  await saveJob(job);
  jobQueue.push(job.id);
  // Start job processing but don't await it to avoid blocking the API response
  triggerNextJob().catch((err) => logger.error("Job trigger failed", err));
}

export async function restoreQueue() {
  if (isInitialized) return;
  await ensureDirs();

  try {
    const files = (await readdir(JOBS_DIR)).filter((f) => f.endsWith(".json"));
    const pendingJobs = [];

    await Promise.all(
      files.map(async (file) => {
        try {
          const content = await readFile(join(JOBS_DIR, file), "utf-8");
          const job = JSON.parse(content);
          if (job.status === "pending" || job.status === "processing") {
            job.status = "pending";
            job.progress = 0;
            // Clean up any stale input file if it somehow doesn't exist
            if (job.inputFile && !existsSync(job.inputFile)) {
              job.status = "error";
              job.error = "Input file lost after restart";
            }
            await saveJob(job);
            if (job.status === "pending") {
              pendingJobs.push(job);
            }
          }
        } catch {}
      }),
    );

    pendingJobs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    pendingJobs.forEach((job) => jobQueue.push(job.id));

    logger.info("Restored jobs from disk", { count: pendingJobs.length });
    isInitialized = true;
    if (pendingJobs.length > 0) {
      triggerNextJob().catch((err) =>
        logger.error("Initial trigger failed", err),
      );
    }
  } catch (err) {
    logger.error("Queue restoration failed", err);
  }
}

async function createZipFromFiles(outputFiles, outputPath) {
  const outputStream = createWriteStream(outputPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const zipFinished = new Promise((resolve, reject) => {
    outputStream.on("close", resolve);
    archive.on("error", reject);
  });

  archive.pipe(outputStream);
  outputFiles.forEach((file) => archive.file(file, { name: basename(file) }));
  await archive.finalize();
  await zipFinished;
}

async function handleJobCompletion(job, result) {
  if (result?.outputFiles?.length > 1) {
    job.targetExt = "zip";
    const newOutputPath = job.outputFile.replace(/\.[^.]+$/, ".zip");
    job.outputFile = newOutputPath;
    await createZipFromFiles(result.outputFiles, newOutputPath);
    await Promise.allSettled(result.outputFiles.map((f) => unlink(f)));
  }

  job.progress = 100;
  job.status = "done";
  await saveJob(job);
  // Keep done jobs in cache for a bit or just remove to save memory
  setTimeout(() => jobCache.delete(job.id), 30000);
}

async function triggerNextJob() {
  if (activeJobCount >= MAX_CONCURRENT_JOBS || jobQueue.length === 0) return;

  activeJobCount++;
  const jobId = jobQueue.shift();
  const job = await getJob(jobId);

  if (!job || job.status === "cancelled") {
    activeJobCount--;
    setImmediate(() =>
      triggerNextJob().catch((err) =>
        logger.error("Nested trigger failed", err),
      ),
    );
    return;
  }

  try {
    job.status = "processing";
    job.progress = 5;
    await saveJob(job);

    const converter = ConverterFactory.getConverter(
      job.inputFile,
      job.targetExt,
    );
    job.onCommand = (proc) => activeProcesses.set(job.id, proc);

    const startTime = Date.now();
    let lastSaveTime = 0;
    let lastSaveProgress = 0;

    const result = await converter.convert(
      job,
      job.settings || {},
      async (progress) => {
        const now = Date.now();
        // Throttled updates: every 1s or 5% change
        if (
          progress - lastSaveProgress >= 5 ||
          now - lastSaveTime >= 1000 ||
          progress >= 100
        ) {
          job.progress = progress;
          lastSaveProgress = progress;
          lastSaveTime = now;
          await saveJob(job);
        }
      },
      async () => {
        const freshJob = await getJob(job.id);
        return freshJob?.status === "cancelled";
      },
    );

    logger.info("Job completed", {
      jobId: job.id,
      durationMs: Date.now() - startTime,
    });
    activeProcesses.delete(job.id);

    const freshJob = await getJob(job.id);
    if (freshJob?.status === "cancelled") {
      const files = result?.outputFiles || [job.outputFile];
      await Promise.allSettled(files.map((f) => unlink(f)));
    } else if (result === "cancelled") {
      job.status = "cancelled";
      job.progress = 0;
      await saveJob(job);
    } else {
      await handleJobCompletion(job, result);
    }

    // Always attempt to remove input file
    await unlink(job.inputFile).catch(() => {});
  } catch (error) {
    activeProcesses.delete(job.id);
    logger.error("Job failed", error, { jobId: job.id });

    const freshJob = await getJob(job.id);
    if (freshJob && freshJob.status !== "cancelled") {
      job.status = "error";
      job.error = error.message;
      await saveJob(job);
    }
  } finally {
    activeJobCount--;
    // Use setImmediate to avoid deep recursion
    setImmediate(() =>
      triggerNextJob().catch((err) =>
        logger.error("Cleanup trigger failed", err),
      ),
    );
  }
}
