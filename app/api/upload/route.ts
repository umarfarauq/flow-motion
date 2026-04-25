import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured. Please check your environment variables." },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create a unique filename while preserving extension
    const extension = file.name.split('.').pop() || 'png';
    const fileName = `${nanoid()}.${extension}`;

    const { error } = await supabase.storage
      .from("assets")
      .upload(fileName, buffer, {
        contentType: file.type || "image/png",
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage.from("assets").getPublicUrl(fileName);

    return NextResponse.json({ 
      url: publicUrlData.publicUrl,
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
