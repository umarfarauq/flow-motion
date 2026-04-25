import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const safeId = id.replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = path.join("/tmp", "flowmotion-generated", safeId);
    const bytes = await fs.readFile(filePath);

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Video not found." }, { status: 404 });
  }
}

