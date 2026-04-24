export type WebContent = {
  url: string;
  title: string;
  text: string;
  images: string[];
};

function extractTagContents(html: string, tag: string) {
  const pattern = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(pattern);
  return match?.[1]?.replace(/\s+/g, " ").trim() ?? "";
}

export async function extractWebContent(url: string): Promise<WebContent> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "FlowMotionAI/1.0",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch link input: ${response.status}`);
  }

  const html = await response.text();
  const title = extractTagContents(html, "title");
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);
  const images = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi))
    .map((match) => match[1])
    .slice(0, 12);

  return {
    url,
    title,
    text,
    images,
  };
}
