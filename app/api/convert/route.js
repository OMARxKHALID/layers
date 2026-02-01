import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { join, extname, basename } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { unlink } from "fs/promises";
import { fileTypeFromStream } from "file-type";
import {
  ensureDirs,
  saveJob,
  processJob,
  UPLOAD_DIR,
  OUTPUT_DIR,
} from "@/utils/server-utils";
import {
  CONVERSION_OPTIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MIME_TYPE_MAP,
} from "@/lib/config";
import { z } from "zod";

const settingsSchema = z.object({
  quality: z.number().min(1).max(100).optional().default(100),
  grayscale: z.boolean().optional().default(false),
  rotation: z.number().optional().default(0),
  scale: z.number().min(1).max(100).optional().default(100),
  width: z.number().positive().nullable().optional(),
  height: z.number().positive().nullable().optional(),
  fps: z.number().positive().nullable().optional(),
  audioBitrate: z.string().optional(),
  frameOffset: z.number().min(0).optional().default(0),
  aspectRatio: z.string().optional(),
  flip: z.boolean().optional().default(false),
  flop: z.boolean().optional().default(false),
  multiSize: z.boolean().optional().default(false),
  proMode: z.boolean().optional().default(false),
  stripMetadata: z.boolean().optional().default(false),
});

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > RATE_LIMIT_WINDOW) {
    userData.count = 1;
    userData.startTime = now;
    rateLimitMap.set(ip, userData);
    return false;
  }

  userData.count++;
  rateLimitMap.set(ip, userData);
  return userData.count > MAX_REQUESTS_PER_WINDOW;
}

const sanitizeFilename = (name) => {
  const filename = basename(name);
  const safe = filename.replace(/[^\w.-]/g, "_");
  const final = safe.startsWith(".") ? `file${safe}` : safe || "unnamed_file";
  return final.slice(0, 255);
};

export async function POST(request) {
  try {
    await ensureDirs();

    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const conversionType = formData.get("conversionType");
    const settingsJson = formData.get("settings");

    if (!file || !conversionType || typeof file === "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const typeConfig = CONVERSION_OPTIONS.find(
      (opt) => opt.id === conversionType,
    );
    if (!typeConfig) {
      return NextResponse.json(
        { error: "Invalid conversion format" },
        { status: 400 },
      );
    }

    let settings;
    try {
      const parsed = settingsJson ? JSON.parse(settingsJson) : {};
      settings = settingsSchema.parse(parsed);
    } catch (e) {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }

    const sanitizedFileName = sanitizeFilename(file.name);
    const fileExt = extname(sanitizedFileName).toLowerCase().replace(".", "");
    const expectedMime = MIME_TYPE_MAP[fileExt];

    if (!expectedMime || (file.type && file.type !== expectedMime)) {
      return NextResponse.json(
        { error: "Invalid file type or extension" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large (Max ${MAX_FILE_SIZE_MB}MB)` },
        { status: 400 },
      );
    }

    const jobId = randomUUID();
    const targetExt = conversionType.replace("to-", "");
    const inputPath = join(UPLOAD_DIR, `${jobId}_${sanitizedFileName}`);
    const outputPath = join(OUTPUT_DIR, `${jobId}.${targetExt}`);

    let isQueued = false;
    try {
      const [streamForValidation, streamForSave] = file.stream().tee();
      const detectedType = await fileTypeFromStream(streamForValidation);

      if (detectedType && expectedMime !== detectedType.mime) {
        const isSvgMismach =
          fileExt === "svg" && detectedType.mime.includes("xml");
        const isM4aMismatch =
          detectedType.mime.includes("video/mp4") && fileExt === "m4a";

        if (!isSvgMismach && !isM4aMismatch) {
          throw new Error("Security check failed: MIME mismatch");
        }
      }

      await pipeline(
        Readable.fromWeb(streamForSave),
        createWriteStream(inputPath),
      );

      const job = {
        id: jobId,
        status: "pending",
        progress: 0,
        inputFile: inputPath,
        outputFile: outputPath,
        targetExt,
        createdAt: Date.now(),
      };

      await saveJob(job);
      processJob(job, settings);
      isQueued = true;

      return NextResponse.json({ jobId });
    } catch (e) {
      if (inputPath && !isQueued) {
        await unlink(inputPath).catch(() => {});
      }
      throw e;
    }
  } catch (error) {
    console.error("API Error:", error);
    const status = error.message.includes("Security check") ? 400 : 500;
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status },
    );
  }
}
