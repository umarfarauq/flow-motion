export function createRenderPayload(input: {
  prompt: string;
  storyboard: Record<string, unknown> | null;
  animation: Record<string, unknown> | null;
  image?: {
    dataUrl?: string;
    sourceUrl?: string;
    mimeType?: string;
    fileName?: string;
  } | null;
}) {
  const scenes = Array.isArray(input.storyboard?.scenes) ? input.storyboard.scenes : [];
  const instructions = Array.isArray(input.animation?.instructions) ? input.animation.instructions : [];

  return {
    compositionId: "FlowMotionComposition",
    fps: 30,
    width: 1920,
    height: 1080,
    durationInFrames: scenes.reduce((total, scene) => {
      const duration = typeof scene === "object" && scene && "durationInSeconds" in scene ? Number(scene.durationInSeconds) : 3;
      return total + Math.round(duration * 30);
    }, 0),
    prompt: input.prompt,
    scenes,
    instructions,
    image: input.image ?? null,
  };
}
