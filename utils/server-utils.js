import { writeFile, readFile, unlink, mkdir, readdir, stat } from "fs/promises";
import { existsSync } from "fs";
import { join, basename } from "path";
import { tmpdir } from "os";
import JSZip from "jszip";
import { ConverterFactory } from "../lib/converters";

export const TEMP_DIR = join(tmpdir(), "morpho_data");
export const UPLOAD_DIR = join(TEMP_DIR, "uploads");
export const OUTPUT_DIR = join(TEMP_DIR, "outputs");
export const JOBS_DIR = join(TEMP_DIR, "jobs");

const CLEANUP_MAX_AGE = 60 * 60 * 1000;
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = 0;

// Store active processes for cancellation
const activeProcesses = new Map();

export async function ensureDirs() {
  await Promise.all([
    !existsSync(UPLOAD_DIR) && mkdir(UPLOAD_DIR, { recursive: true }),
    !existsSync(OUTPUT_DIR) && mkdir(OUTPUT_DIR, { recursive: true }),
    !existsSync(JOBS_DIR) && mkdir(JOBS_DIR, { recursive: true }),
  ]);
  scheduleCleanup();
}

export async function saveJob(job) {
  await writeFile(join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job));
}

export async function getJob(id) {
  try {
    return JSON.parse(await readFile(join(JOBS_DIR, `${id}.json`), "utf-8"));
  } catch {
    return null;
  }
}

export async function cancelJob(id) {
  const proc = activeProcesses.get(id);
  if (proc) {
    if (proc.kill) proc.kill("SIGKILL");
    else if (proc.abort) proc.abort();
    activeProcesses.delete(id);
    return true;
  }
  return false;
}

async function runCleanup() {
  const dirs = [UPLOAD_DIR, OUTPUT_DIR, JOBS_DIR];
  const now = Date.now();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
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
  }
  lastCleanup = now;
}

function scheduleCleanup() {
  if (Date.now() - lastCleanup >= CLEANUP_INTERVAL) {
    runCleanup().catch(() => {});
  }
}

export async function processJob(job, settings) {
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
      job.progress = p;
      await saveJob(job);
    });

    activeProcesses.delete(job.id);

    if (result === "cancelled") {
      job.status = "cancelled";
      job.progress = 0;
    } else {
      // Handle multi-file results (zip them)
      if (result && result.outputFiles && result.outputFiles.length > 1) {
        const zip = new JSZip();
        for (const filePath of result.outputFiles) {
          const content = await readFile(filePath);
          zip.file(basename(filePath), content);
        }
        const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

        // Update job to be a zip
        job.targetExt = "zip";
        const newOutputPath = job.outputFile.replace(/\.[^.]+$/, ".zip");
        await writeFile(newOutputPath, zipBuffer);
        job.outputFile = newOutputPath;

        // Cleanup individual files
        for (const filePath of result.outputFiles) {
          await unlink(filePath).catch(() => {});
        }
      }

      job.progress = 100;
      job.status = "done";
    }

    await saveJob(job);
    await unlink(job.inputFile).catch(() => {});
  } catch (error) {
    activeProcesses.delete(job.id);
    job.status = "error";
    job.error = error.message;
    await saveJob(job);
  }
}
