type RenderVideoArgs = {
  jobId: string;
  payload: Record<string, unknown>;
  apiKey?: string;
};

export async function renderWorkflowVideo({ jobId, payload, apiKey }: RenderVideoArgs) {
  const { generateVideoWithGemini } = await import("@/lib/ai/gemini");
  const prompt = typeof payload.prompt === "string" ? payload.prompt : "";

  if (!prompt) {
    throw new Error("Missing prompt for Gemini video generation.");
  }

  const result = await generateVideoWithGemini({
    apiKey,
    jobId,
    prompt,
    image:
      payload.image && typeof payload.image === "object"
        ? {
            dataUrl:
              "dataUrl" in payload.image && typeof payload.image.dataUrl === "string"
                ? payload.image.dataUrl
                : undefined,
            sourceUrl:
              "sourceUrl" in payload.image && typeof payload.image.sourceUrl === "string"
                ? payload.image.sourceUrl
                : undefined,
            mimeType:
              "mimeType" in payload.image && typeof payload.image.mimeType === "string"
                ? payload.image.mimeType
                : undefined,
          }
        : null,
  });

  return {
    mode: "gemini-veo",
    outputUrl: result.outputUrl,
    payload,
  };
}
