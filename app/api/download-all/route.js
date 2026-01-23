import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { getJob, ensureDirs, OUTPUT_DIR } from "@/utils/server-utils";
import JSZip from "jszip";

export async function POST(request) {
  try {
    await ensureDirs();
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const zip = new JSZip();
    let fileCount = 0;
    const skippedReasons = [];

    for (const item of items) {
      if (!item.jobId) {
        skippedReasons.push(`Item ${item.fileName || "unknown"} missing ID`);
        continue;
      }

      const job = await getJob(item.jobId);
      if (!job) {
        skippedReasons.push(`Job ${item.jobId} not found`);
        continue;
      }

      if (job.status !== "done" || !job.outputFile) {
        skippedReasons.push(`Job ${item.jobId} incomplete`);
        continue;
      }

      try {
        let finalPath = job.outputFile;
        // Migration Fallback: If path shifted (e.g. from morpho_data to layers_data)
        if (!existsSync(finalPath)) {
          const fileName = finalPath.split(/[\\/]/).pop();
          const currentCandidate = join(OUTPUT_DIR, fileName);
          if (existsSync(currentCandidate)) {
            finalPath = currentCandidate;
          }
        }

        if (!existsSync(finalPath)) {
          skippedReasons.push(`File for ${item.jobId} missing from disk`);
          continue;
        }

        const content = await readFile(finalPath);
        const entryName =
          item.fileName || `file_${item.jobId}.${job.targetExt}`;
        zip.file(entryName, content);
        fileCount++;
      } catch (e) {
        console.error(`Read error for job ${item.jobId}:`, e);
        skippedReasons.push(`Internal error reading ${item.jobId}`);
      }
    }

    if (fileCount === 0) {
      const why =
        skippedReasons.length > 0 ? ": " + skippedReasons.join(", ") : "";
      return NextResponse.json(
        { error: "No valid files found for the archive" + why },
        { status: 404 },
      );
    }

    const zipContent = await zip.generateAsync({ type: "uint8array" });

    return new NextResponse(zipContent, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="layers_bundle.zip"',
        "Content-Length": zipContent.byteLength.toString(),
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
