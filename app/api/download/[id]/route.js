import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getJob, ensureDirs } from "@/utils/server-utils";

export async function GET(request, { params }) {
  try {
    await ensureDirs();
    const { id } = await params;

    const job = await getJob(id);
    if (!job || job.status !== "done") {
      return NextResponse.json({ error: "File not ready" }, { status: 404 });
    }

    const url = new URL(request.url);
    const requestedName = url.searchParams.get("filename");
    const isPreview = url.searchParams.has("preview");
    const downloadName =
      requestedName || `morpho_${id.slice(0, 8)}.${job.targetExt}`;

    const fileBuffer = await readFile(job.outputFile);
    const headers = {
      "Content-Type":
        {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
          avif: "image/avif",
        }[job.targetExt] || "application/octet-stream",
    };

    if (!isPreview) {
      headers["Content-Disposition"] =
        `attachment; filename="${encodeURIComponent(downloadName)}"`;
    }

    return new NextResponse(fileBuffer, { headers });
  } catch (error) {
    return NextResponse.json(
      { error: "File missing on server" },
      { status: 500 },
    );
  }
}
