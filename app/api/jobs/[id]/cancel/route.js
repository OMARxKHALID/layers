import { NextResponse } from "next/server";
import { cancelJob, ensureDirs } from "@/utils/server-utils";

export async function POST(request, { params }) {
  try {
    await ensureDirs();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing Job ID" }, { status: 400 });
    }

    const cancelled = await cancelJob(id);

    return NextResponse.json({ success: cancelled });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
