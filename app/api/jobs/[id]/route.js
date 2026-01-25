import { NextResponse } from "next/server";
import { getJob, ensureDirs } from "@/utils/server-utils";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing Job ID" }, { status: 400 });
    }

    const job = await getJob(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      progress: job.progress,
      error: job.error,
      targetExt: job.targetExt,
      downloadUrl: job.status === "done" ? `/api/download/${id}` : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
