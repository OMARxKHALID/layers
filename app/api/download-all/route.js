import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getJob, ensureDirs } from "@/utils/server-utils";
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

    for (const item of items) {
      if (!item.jobId) continue;
      const job = await getJob(item.jobId);
      if (job && job.status === "done" && job.outputFile) {
        try {
          const content = await readFile(job.outputFile);
          zip.file(
            item.fileName || `file_${item.jobId}.${job.targetExt}`,
            content,
          );
          fileCount++;
        } catch (e) {
          console.error(`Failed to read file for job ${item.jobId}`, e);
        }
      }
    }

    if (fileCount === 0) {
      return NextResponse.json(
        { error: "No valid files found to zip" },
        { status: 404 },
      );
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(zipContent, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="morpho_bundle.zip"',
      },
    });
  } catch (error) {
    console.error("Zip generation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
