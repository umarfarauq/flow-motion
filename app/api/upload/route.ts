import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Create a unique filename while preserving extension
    const extension = file.name.split('.').pop() || 'png';
    const fileName = `${nanoid()}.${extension}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const outPath = path.join(uploadsDir, fileName);
    await fs.writeFile(outPath, buffer);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const publicUrl = `${baseUrl}/uploads/${fileName}`;

    return NextResponse.json({
      url: publicUrl,
      fileName: file.name,
      mimeType: file.type
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}
