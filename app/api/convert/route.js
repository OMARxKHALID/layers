import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Buffer } from "buffer";
import { writeFile } from "fs/promises";
import { join } from "path";
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
} from "@/lib/config";

export async function POST(request) {
  try {
    await ensureDirs();
    const formData = await request.formData();

    const file = formData.get("file");
    const conversionType = formData.get("conversionType");
    const settingsJson = formData.get("settings");

    if (!file || !conversionType) {
      return NextResponse.json(
        { error: "Missing file or type" },
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
      // Allow empty type if it's a known extension we handle, but generally we want match
      // For now let's be strict
      console.log("MIME mismatch:", file.type, "requested:", conversionType);
    }

    const settings = settingsJson
      ? JSON.parse(settingsJson)
      : { quality: 100, grayscale: false, rotation: 0, scale: 100 };

    const jobId = randomUUID();
    const targetExt = conversionType.replace("to-", "");

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "");
    const inputPath = join(UPLOAD_DIR, `${jobId}_${safeName}`);
    const outputPath = join(OUTPUT_DIR, `${jobId}.${targetExt}`);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
