import type { ExecutableNodeContext } from "@/types/flow";
import { invariant } from "@/lib/utils";
import { extractWebContent } from "@/lib/services/web-content";
import {
  generateAnimationInstructionsWithGemini,
  generateStoryboardWithGemini,
} from "@/lib/ai/gemini";
import { createRenderPayload } from "@/lib/workflow/render-payload";

export type NodeExecutor = (context: ExecutableNodeContext) => Promise<unknown>;

export const nodeExecutors: Record<string, NodeExecutor> = {
  linkInput: async ({ node }) => {
    const url = node.data.values?.url;
    invariant(url, "Link Input node requires a URL.");
    return extractWebContent(url);
  },
  textPrompt: async ({ node }) => ({
    prompt: node.data.values?.prompt || "",
  }),
  mediaUpload: async ({ node }) => ({
    mediaUrl: node.data.values?.mediaUrl || "",
    mediaDataUrl: node.data.values?.mediaDataUrl || "",
    mimeType: node.data.values?.mimeType || "",
    fileName: node.data.values?.fileName || "",
  }),
  contentExtractor: async ({ upstream }) => {
    const merged = upstream.map((item) => item.output);
    return {
      summary: merged
        .map((entry) => JSON.stringify(entry))
        .join("\n")
        .slice(0, 6000),
      sources: merged,
    };
  },
  sceneGenerator: async ({ upstream }) => {
    const prompt =
      upstream
        .map((item) => {
          const output = item.output as Record<string, unknown>;
          return typeof output?.prompt === "string" ? output.prompt : JSON.stringify(output);
        })
        .join("\n") || "Create a motion graphics storyboard.";

    const sourceSummary = upstream.map((item) => JSON.stringify(item.output)).join("\n");
    const storyboard = await generateStoryboardWithGemini({ prompt, sourceSummary });

    return {
      ...storyboard,
    };
  },
  animationStyle: async ({ node, upstream }) => {
    const storyboard = upstream.find((item) => {
      const output = item.output as Record<string, unknown>;
      return Array.isArray(output?.scenes);
    })?.output as { scenes: Array<{ title: string; description: string; durationInSeconds: number }> } | undefined;

    invariant(storyboard?.scenes?.length, "Animation Style node requires storyboard scenes upstream.");

    return generateAnimationInstructionsWithGemini({
      style: node.data.values?.style || "Minimal monochrome motion",
      scenes: storyboard.scenes,
    });
  },
  videoRender: async ({ upstream }) => {
    const storyboard = upstream.find((item) => {
      const output = item.output as Record<string, unknown>;
      return Array.isArray(output?.scenes);
    })?.output;
    const animation = upstream.find((item) => {
      const output = item.output as Record<string, unknown>;
      return Array.isArray(output?.instructions);
    })?.output;

    const promptOutput = upstream
      .map((item) => item.output as Record<string, unknown>)
      .find((output) => typeof output?.prompt === "string");
    const mediaOutput = upstream
      .map((item) => item.output as Record<string, unknown>)
      .find((output) => typeof output?.mediaUrl === "string" || typeof output?.mediaDataUrl === "string");

    const prompt = [
      typeof promptOutput?.prompt === "string" ? promptOutput.prompt : "",
      typeof storyboard === "object" && storyboard && "summary" in (storyboard as Record<string, unknown>)
        ? String((storyboard as Record<string, unknown>).summary)
        : "",
      typeof animation === "object" && animation && "style" in (animation as Record<string, unknown>)
        ? `Motion direction: ${String((animation as Record<string, unknown>).style)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    invariant(prompt, "Video Render node requires a text prompt or generated storyboard context.");

    return createRenderPayload({
      prompt,
      storyboard: (storyboard as Record<string, unknown>) ?? null,
      animation: (animation as Record<string, unknown>) ?? null,
      image: mediaOutput
        ? {
            dataUrl: typeof mediaOutput.mediaDataUrl === "string" ? mediaOutput.mediaDataUrl : undefined,
            sourceUrl: typeof mediaOutput.mediaUrl === "string" ? mediaOutput.mediaUrl : undefined,
            mimeType: typeof mediaOutput.mimeType === "string" ? mediaOutput.mimeType : undefined,
            fileName: typeof mediaOutput.fileName === "string" ? mediaOutput.fileName : undefined,
          }
        : null,
    });
  },
};
