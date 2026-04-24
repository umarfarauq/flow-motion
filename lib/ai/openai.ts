import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  return client;
}

export async function generateStoryboard(input: {
  prompt: string;
  sourceSummary?: string;
}) {
  const openai = getClient();

  if (!openai) {
    return {
      summary: "OpenAI API key not configured. Generated local storyboard fallback.",
      scenes: [
        {
          title: "Intro Frame",
          description: input.prompt || input.sourceSummary || "Minimal motion opener.",
          durationInSeconds: 3,
        },
        {
          title: "Core Reveal",
          description: "Introduce the main message with kinetic type and structured media blocks.",
          durationInSeconds: 4,
        },
        {
          title: "Closing Frame",
          description: "Resolve the motion with a strong final CTA and clean lockup.",
          durationInSeconds: 3,
        },
      ],
    };
  }

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "You create structured motion design storyboards. Return concise JSON with summary and scenes. Each scene needs title, description, durationInSeconds.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "storyboard",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            scenes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  durationInSeconds: { type: "number" },
                },
                required: ["title", "description", "durationInSeconds"],
              },
            },
          },
          required: ["summary", "scenes"],
        },
      },
    },
  });

  const raw = response.output_text;

  return JSON.parse(raw);
}

export async function generateAnimationInstructions(input: {
  style: string;
  scenes: Array<{ title: string; description: string; durationInSeconds: number }>;
}) {
  const openai = getClient();

  if (!openai) {
    return {
      style: input.style || "Minimal monochrome motion",
      instructions: input.scenes.map((scene, index) => ({
        sceneIndex: index,
        title: scene.title,
        motion: "Slide in typography, scale media frame, hold, then wipe to next scene.",
      })),
    };
  }

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Transform storyboard scenes into compact animation instructions. Return JSON with style and instructions array of sceneIndex,title,motion.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  return JSON.parse(response.output_text);
}
