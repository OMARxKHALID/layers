import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
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

    const { size } = await stat(job.outputFile);
    const nodeStream = createReadStream(job.outputFile);

    // Convert Node stream to Web stream using Node 18+ API
    const webStream = Readable.toWeb(nodeStream);

    const contentType =
      {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        gif: "image/gif",
        avif: "image/avif",
        mp4: "video/mp4",
        webm: "video/webm",
        mp3: "audio/mpeg",
      }[job.targetExt.toLowerCase()] || "application/octet-stream";

    const headers = new Headers({
      "Content-Length": size.toString(),
      "Content-Type": contentType,
    });

    if (!isPreview) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(downloadName)}"`,
      );
    }

    return new NextResponse(webStream, { headers });
  } catch (error) {
    console.error("File download error:", error);
    return NextResponse.json(
      { error: "File missing on server" },
      { status: 500 },
    );
  }
}
