import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { getJob, ensureDirs, OUTPUT_DIR } from "@/utils/server-utils";
import archiver from "archiver";
import { Writable } from "stream";

export async function POST(request) {
  try {
    await ensureDirs();
    const formData = await request.formData();
    const files = formData.getAll("files");
    const serverItemsJson = formData.get("serverItems");
    let serverItems = [];

    if (serverItemsJson) {
      try {
        serverItems = JSON.parse(serverItemsJson);
      } catch (e) {
        console.error("Failed to parse serverItems", e);
      }
    }

    if (files.length === 0 && serverItems.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const skippedReasons = [];
    let fileCount = 0;

    // Create a buffer to store the zip content
    const chunks = [];
    const writable = new Writable({
      write(chunk, encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    const archive = archiver("zip", { zlib: { level: 9 } });

    // Handle errors on the archive
    const archivePromise = new Promise((resolve, reject) => {
      archive.on("error", reject);
      writable.on("finish", resolve);
    });

    archive.pipe(writable);

    // 1. Process Client-Uploaded Files (Blobs)
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      archive.append(buffer, { name: file.name });
      fileCount++;
    }

    // 2. Process Server-Side Files
    for (const item of serverItems) {
      if (!item.jobId) continue;

      const job = await getJob(item.jobId);
      if (!job || job.status !== "done" || !job.outputFile) {
        skippedReasons.push(`Job ${item.jobId} invalid`);
        continue;
      }

      let finalPath = job.outputFile;
      if (!existsSync(finalPath)) {
        const fileName = finalPath.split(/[\\/]/).pop();
        const currentCandidate = join(OUTPUT_DIR, fileName);
        if (existsSync(currentCandidate)) {
          finalPath = currentCandidate;
        } else {
          skippedReasons.push(`File missing for ${item.jobId}`);
          continue;
        }
      }

      // Read file content
      const content = await readFile(finalPath);
      const entryName = item.fileName || `file_${item.jobId}.${job.targetExt}`;

      archive.append(content, { name: entryName });
      fileCount++;
    }

    if (fileCount === 0) {
      return NextResponse.json(
        { error: "No valid files found to download" },
        { status: 404 },
      );
    }

    await archive.finalize();
    await archivePromise;

    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="layers_bundle.zip"',
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Zip generation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 },
    );
  }
}
