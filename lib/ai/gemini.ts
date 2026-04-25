import { promises as fs } from "node:fs";
import path from "node:path";

type GenerateVideoArgs = {
  apiKey?: string;
  jobId: string;
  prompt: string;
  image?: {
    dataUrl?: string;
    sourceUrl?: string;
    mimeType?: string;
  } | null;
};

type GeminiClientOptions = {
  apiKey?: string;
};

function getApiKey(options: GeminiClientOptions = {}) {
  const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API key missing. Add `GEMINI_API_KEY` or paste your key into the app before generating.");
  }

  return apiKey;
}

async function geminiJsonRequest<T>(
  apiKey: string,
  endpoint: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

function extractJson<T>(text: string, fallback: T): T {
  try {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first === -1 || last === -1) {
      return fallback;
    }

    return JSON.parse(text.slice(first, last + 1)) as T;
  } catch {
    return fallback;
  }
}

export async function generateStoryboardWithGemini(
  input: {
    prompt: string;
    sourceSummary?: string;
  },
  options: GeminiClientOptions = {},
) {
  const apiKey = getApiKey(options);
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const response = await geminiJsonRequest<{
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  }>(apiKey, `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "Turn this creative brief into a concise motion storyboard.",
              "Return JSON only with keys: summary, scenes.",
              "Each scene must include: title, description, durationInSeconds.",
              `Prompt: ${input.prompt}`,
              `Source summary: ${input.sourceSummary || "None"}`,
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";

  return extractJson(text, {
    summary: "Gemini storyboard fallback.",
    scenes: [
      { title: "Opening", description: input.prompt, durationInSeconds: 3 },
      { title: "Middle", description: "Develop the main visual motion idea.", durationInSeconds: 3 },
      { title: "Close", description: "End on a clean resolved frame.", durationInSeconds: 2 },
    ],
  });
}

export async function generateAnimationInstructionsWithGemini(
  input: {
    style: string;
    scenes: Array<{ title: string; description: string; durationInSeconds: number }>;
  },
  options: GeminiClientOptions = {},
) {
  const apiKey = getApiKey(options);
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const response = await geminiJsonRequest<{
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  }>(apiKey, `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: [
              "Convert this storyboard into motion direction instructions.",
              "Return JSON only with keys: style, instructions.",
              "Each instruction must include: sceneIndex, title, motion.",
              `Preferred style: ${input.style || "Minimal monochrome motion"}`,
              `Scenes: ${JSON.stringify(input.scenes)}`,
            ].join("\n"),
          },
        ],
      },
    ],
  });

  const text = response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";

  return extractJson(text, {
    style: input.style || "Minimal monochrome motion",
    instructions: input.scenes.map((scene, sceneIndex) => ({
      sceneIndex,
      title: scene.title,
      motion: "Use restrained camera movement, sharp transitions, and clean typography pacing.",
    })),
  });
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid uploaded media format.");
  }

  return {
    mimeType: match[1],
    bytesBase64Encoded: match[2],
  };
}

async function fetchRemoteImageAsBase64(sourceUrl: string, mimeType?: string) {
  const response = await fetch(sourceUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch source image: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    mimeType: mimeType || response.headers.get("content-type") || "image/png",
    bytesBase64Encoded: buffer.toString("base64"),
  };
}

export async function generateVideoWithGemini(args: GenerateVideoArgs) {
  const apiKey = getApiKey({ apiKey: args.apiKey });

  let image: { mimeType: string; bytesBase64Encoded: string } | undefined;
  if (args.image?.dataUrl) {
    image = parseDataUrl(args.image.dataUrl);
  } else if (args.image?.sourceUrl) {
    image = await fetchRemoteImageAsBase64(args.image.sourceUrl, args.image.mimeType);
  }

  const model = process.env.GEMINI_VIDEO_MODEL || "veo-3.1-generate-preview";

  let operation = await geminiJsonRequest<{ name: string; done?: boolean; response?: unknown }>(
    apiKey,
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predictLongRunning`,
    {
      instances: [
        {
          prompt: [
            "Flat design, 2D UI/UX motion graphics, SaaS product interface animation.",
            `Focus on: ${args.prompt}`,
            "Movement rules: Smooth bezier curve animations, hovering cursor interaction, expanding UI cards.",
            "Style constraints: Minimalist digital interface, high contrast, clean typography, absolutely no humans, no live-action, strictly vector graphics."
          ].join("\n\n"),
          ...(image ? { image } : {}), // Only include image if present, and only with supported fields
        },
      ],
      parameters: {
        aspectRatio: "16:9",
      },
    },
  );

  while (!operation.done) {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operation.name}?key=${encodeURIComponent(apiKey)}`,
      {
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Gemini operation polling failed (${response.status}): ${text}`);
    }

    operation = (await response.json()) as typeof operation;
  }

  const generatedVideoUri =
    ((operation.response as { generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> } })
      ?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ??
      null);

  if (!generatedVideoUri) {
    throw new Error("Gemini did not return a video.");
  }

  const videoResponse = await fetch(generatedVideoUri, {
    headers: {
      "x-goog-api-key": apiKey,
    },
    cache: "no-store",
  });

  if (!videoResponse.ok) {
    const text = await videoResponse.text();
    throw new Error(`Gemini video download failed (${videoResponse.status}): ${text}`);
  }

  const buffer = Buffer.from(await videoResponse.arrayBuffer());
  const fileName = `${args.jobId}.mp4`;

  const generatedDir = path.join(process.cwd(), "public", "generated");
  await fs.mkdir(generatedDir, { recursive: true });
  const outPath = path.join(generatedDir, fileName);
  await fs.writeFile(outPath, buffer);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = `${baseUrl}/generated/${fileName}`;

  return {
    outputUrl: publicUrl,
    provider: "gemini-veo",
    model,
  };
}
