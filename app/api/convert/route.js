import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createWriteStream } from "fs";
import { join, extname, basename } from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
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
// Basic in-memory rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
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

export async function POST(request) {
  try {
    await ensureDirs();

    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const formData = await request.formData();

    const sanitizeFilename = (name) => {
      // 1. Remove any path info
      const filename = basename(name);
      // 2. Transliterate or replace non-safe chars
      const safe = filename.replace(/[^\w.-]/g, "_");
      // 3. Ensure it's not a hidden file or empty
      const final = safe.startsWith(".")
        ? `file${safe}`
        : safe || "unnamed_file";
      // 4. Limit length
      return final.slice(0, 255);
    };

    const file = formData.get("file");
    const conversionType = formData.get("conversionType");
    const settingsJson = formData.get("settings");

    if (!file || !conversionType || typeof file === "string") {
      return NextResponse.json(
        { error: "Missing file or invalid request" },
        { status: 400 },
      );
    }

    const sanitizedFileName = sanitizeFilename(file.name);
    const fileExt = extname(sanitizedFileName).toLowerCase().replace(".", "");

    // 1. Strict extension and MIME validation
    const allowedExts = Object.keys(MIME_TYPE_MAP);
    if (!allowedExts.includes(fileExt)) {
      return NextResponse.json(
        { error: `Unsupported file extension: .${fileExt}` },
        { status: 400 },
      );
    }

    // Strict check: Does the extension match the MIME type provided by the browser?
    // This prevents uploading 'malicious.php' renamed to 'malicious.png'
    const expectedMime = MIME_TYPE_MAP[fileExt];
    if (file.type && file.type !== expectedMime) {
      return NextResponse.json(
        { error: `MIME type mismatch for .${fileExt}` },
        { status: 400 },
      );
    }

    // 1. Server-side validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large (Max ${MAX_FILE_SIZE_MB}MB)` },
        { status: 400 },
      );
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

    // Basic MIME check (checking if the format can accept this type of file header)
    // Note: browser is usually reliable here, but we check against our config
    if (!typeConfig.accepts.includes(file.type) && file.type !== "") {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}` },
        { status: 400 },
      );
    }

    let settings;
    try {
      const parsed = settingsJson ? JSON.parse(settingsJson) : {};
      settings = settingsSchema.parse(parsed);
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid settings: " + e.errors?.[0]?.message || e.message },
        { status: 400 },
      );
    }

    const jobId = randomUUID();
    const targetExt = conversionType.replace("to-", "");

    const inputPath = join(UPLOAD_DIR, `${jobId}_${sanitizedFileName}`);
    const outputPath = join(OUTPUT_DIR, `${jobId}.${targetExt}`);

    // 2. Streaming file write to save memory using the requested reader pattern
    const reader = file.stream().getReader();
    const nodeStream = new Readable({
      async read() {
        const { done, value } = await reader.read();
        if (done) this.push(null);
        else this.push(Buffer.from(value));
      },
    });

    try {
      await pipeline(nodeStream, createWriteStream(inputPath));
    } catch (writeError) {
      console.error("File write error:", writeError);
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 },
      );
    }

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

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error("Critical API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
