import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

function toDataUrl(buffer: Buffer, mimeType: string) {
  const safe = mimeType && mimeType.includes("/") ? mimeType : "application/octet-stream";
  return `data:${safe};base64,${buffer.toString("base64")}`;
}

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

    let publicUrl: string | null = null;
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const outPath = path.join(uploadsDir, fileName);
      await fs.writeFile(outPath, buffer);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      publicUrl = `${baseUrl}/uploads/${fileName}`;
    } catch {
      // Serverless prod: cannot write to the bundle/public directory.
      // Return an inline data URL so the rest of the pipeline still works.
      publicUrl = toDataUrl(buffer, file.type || "image/png");
    }

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
