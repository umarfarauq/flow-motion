import { supabase } from "@/lib/supabase";

export type GenerateVideoArgs = {
  jobId: string;
  prompt: string;
  image?: {
    sourceUrl?: string;
    dataUrl?: string;
    mimeType: string;
  };
  apiKey?: string;
};

function getApiKey(args: { apiKey?: string }) {
  const key = args.apiKey || process.env.FAL_KEY;
  if (!key) {
    throw new Error("Missing FAL_KEY. Please provide it in your .env.local file or in the node settings.");
  }
  return key;
}

export async function generateVideoWithSeedance(args: GenerateVideoArgs) {
  const falKey = getApiKey({ apiKey: args.apiKey });

  const templatePrompt = [
    "Flat design, 2D UI/UX motion graphics, SaaS product interface animation.",
    `Focus on: ${args.prompt}`,
    "Movement rules: Smooth bezier curve animations, hovering cursor interaction, expanding UI cards.",
    "Style constraints: Minimalist digital interface, high contrast, clean typography, absolutely no humans, no live-action, strictly vector graphics."
  ].join("\n\n");

  const isImageToVideo = !!(args.image?.sourceUrl || args.image?.dataUrl);
  const endpoint = isImageToVideo
    ? "https://queue.fal.run/fal-ai/bytedance/seedance-2.0/image-to-video"
    : "https://queue.fal.run/fal-ai/bytedance/seedance-2.0/text-to-video";

  const payload: any = {
    prompt: templatePrompt,
  };

  if (isImageToVideo) {
    // Fal.ai accepts image URLs directly
    payload.image_url = args.image?.sourceUrl || args.image?.dataUrl;
  }

  // 1. Submit Request
  const submitRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errorText = await submitRes.text();
    throw new Error(`Seedance submission failed: ${errorText}`);
  }

  const { request_id, status_url } = await submitRes.json();

  // 2. Poll Status
  let isCompleted = false;
  let finalResponse = null;

  while (!isCompleted) {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5 seconds

    const statusRes = await fetch(status_url, {
      method: "GET",
      headers: {
        "Authorization": `Key ${falKey}`,
      },
    });

    if (!statusRes.ok) {
      const errorText = await statusRes.text();
      throw new Error(`Seedance status check failed: ${errorText}`);
    }

    const statusData = await statusRes.json();

    if (statusData.status === "COMPLETED") {
      isCompleted = true;
      finalResponse = statusData;
    } else if (statusData.status === "FAILED") {
      throw new Error(`Seedance generation failed: ${statusData.error || "Unknown error"}`);
    }
    // Else IN_QUEUE or IN_PROGRESS, keep looping
  }

  // 3. Extract Video URL and Upload to Supabase
  const videoUrl = finalResponse.video?.url;
  if (!videoUrl) {
    throw new Error("Seedance did not return a video URL.");
  }

  if (!supabase) {
    throw new Error("Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables to save the video.");
  }

  // Fetch the video from fal.ai and upload it to our Supabase bucket
  const videoBlobRes = await fetch(videoUrl);
  if (!videoBlobRes.ok) {
    throw new Error(`Failed to download generated video from fal.ai: ${videoBlobRes.statusText}`);
  }

  const buffer = Buffer.from(await videoBlobRes.arrayBuffer());
  const fileName = `${args.jobId}.mp4`;

  const { data, error } = await supabase.storage
    .from("videos")
    .upload(fileName, buffer, {
      contentType: "video/mp4",
      upsert: true,
    });

  if (error || !data) {
    throw new Error(`Failed to upload to Supabase: ${error?.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from("videos").getPublicUrl(data.path);

  return {
    outputUrl: publicUrlData.publicUrl,
  };
}
