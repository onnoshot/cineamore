import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSceneImage(
  prompt: string,
  manImageUrl: string,
  womanImageUrl: string
): Promise<string> {
  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1792",
    quality: "high",
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image returned from OpenAI");
  return b64;
}

export function b64ToBuffer(b64: string): Buffer {
  return Buffer.from(b64, "base64");
}
