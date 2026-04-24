import Replicate from "replicate";

let replicate: Replicate | null = null;

function getReplicateClient() {
  if (!process.env.REPLICATE_API_TOKEN) {
    return null;
  }

  if (!replicate) {
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  return replicate;
}

export async function generateKeyframeArtwork(prompt: string) {
  const client = getReplicateClient();

  if (!client) {
    return {
      provider: "local-fallback",
      prompt,
      imageUrl: null,
    };
  }

  const output = await client.run(process.env.REPLICATE_MODEL as '`${string}/${string}` | `${string}/${string}:${string}`' || "black-forest-labs/flux-schnell", {
    input: {
      prompt,
    },
  });

  return {
    provider: "replicate",
    prompt,
    imageUrl: Array.isArray(output) ? String(output[0]) : String(output),
  };
}
