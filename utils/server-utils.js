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
  const { onCommand, ...serializableJob } = job;
  await writeFile(
    join(JOBS_DIR, `${job.id}.json`),
    JSON.stringify(serializableJob),
  );
}

export async function getJob(id) {
  const filePath = join(JOBS_DIR, `${id}.json`);
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      if (existsSync(filePath)) {
        return JSON.parse(await readFile(filePath, "utf-8"));
      }
    } catch {
      if (attempt < RETRY_ATTEMPTS - 1) await sleep(RETRY_DELAY);
    }
  }
  return null;
}

export async function cancelJob(id) {
  const queueIndex = jobQueue.indexOf(id);
  if (queueIndex !== -1) {
    jobQueue.splice(queueIndex, 1);
    const job = await getJob(id);
    if (job) {
      job.status = "cancelled";
      await saveJob(job);
    }
    return true;
  }

  const proc = activeProcesses.get(id);
  if (proc) {
    if (proc.kill) proc.kill("SIGTERM");
    else if (proc.abort) proc.abort();
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
        if (job.status === "pending" || job.status === "processing") {
          job.status = "pending";
          job.progress = 0;
          await saveJob(job);
          pendingJobs.push(job);
        }
      } catch {}
    }

    pendingJobs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    pendingJobs.forEach((job) => jobQueue.push(job.id));

    logger.info("Restored jobs from disk", { count: pendingJobs.length });
    isInitialized = true;
    triggerNextJob();
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
    await Promise.all(result.outputFiles.map((f) => unlink(f).catch(() => {})));
  }

  job.progress = 100;
  job.status = "done";
  await saveJob(job);
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
    const result = await converter.convert(
      job,
      job.settings || {},
      async (progress) => {
        job.progress = progress;
        await saveJob(job);
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
      await Promise.all(files.map((f) => unlink(f).catch(() => {})));
    } else if (result === "cancelled") {
      job.status = "cancelled";
      job.progress = 0;
      await saveJob(job);
    } else {
      await handleJobCompletion(job, result);
    }

    await unlink(job.inputFile).catch(() => {});
  } catch (error) {
    activeProcesses.delete(job.id);
    const freshJob = await getJob(job.id);
    if (freshJob?.status !== "cancelled") {
      logger.error("Job failed", error, { jobId: job.id });
      job.status = "error";
      job.error = error.message;
      await saveJob(job);
    }
  } finally {
    activeJobCount--;
    triggerNextJob();
  }
}
