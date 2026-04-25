import { NextResponse } from "next/server";

export const runtime = "nodejs";

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64").toString("utf8");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const u = url.searchParams.get("u");
    if (!u) {
      return NextResponse.json({ error: "Missing video URI." }, { status: 400 });
    }

    const decoded = decodeBase64Url(u);
    if (!decoded.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid video URI." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured." }, { status: 500 });
    }

    const upstream = await fetch(decoded, {
      headers: {
        "x-goog-api-key": apiKey,
      },
      cache: "no-store",
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return NextResponse.json(
        { error: `Upstream video fetch failed (${upstream.status}): ${text}` },
        { status: 502 },
      );
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "video/mp4",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to stream video." },
      { status: 500 },
    );
  }
}

