import Anthropic from "@anthropic-ai/sdk";

const MCP_URL = "https://mcp.higgsfield.ai/mcp";

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic({ apiKey });
}

interface McpCallResult {
  jobId?: string;
  imageUrl?: string;
  videoUrl?: string;
  error?: string;
}

async function callHiggsfieldViaClaude(
  userPrompt: string
): Promise<McpCallResult> {
  const client = getAnthropicClient();
  const token = process.env.HIGGSFIELD_MCP_TOKEN;
  if (!token) throw new Error("HIGGSFIELD_MCP_TOKEN not set");

  const response = await (client.beta.messages as any).create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    betas: ["mcp-client-2025-04-04"],
    mcp_servers: [
      {
        type: "url",
        url: MCP_URL,
        name: "higgsfield",
        authorization_token: token,
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  // Extract text content from response
  const textContent = response.content
    .filter((c: any) => c.type === "text")
    .map((c: any) => c.text)
    .join("\n");

  // Try to parse JSON from response
  try {
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // fallthrough
  }

  return { error: textContent };
}

export async function generateSceneImageViaHiggsfield(
  scenePrompt: string,
  manImageUrl: string,
  womanImageUrl: string
): Promise<string> {
  const prompt = `Use the generate_image tool with these exact parameters:
- model: "gpt_image_2"
- aspect_ratio: "9:16"
- quality: "high"
- resolution: "2k"
- medias: [{"role": "image", "value": "${manImageUrl}"}, {"role": "image", "value": "${womanImageUrl}"}]
- prompt: "${scenePrompt.replace(/"/g, "'")}"

After generating, wait for job completion using job_status tool (with sync: true).
Return ONLY a JSON object: {"imageUrl": "<output_image_url>"}`;

  const result = await callHiggsfieldViaClaude(prompt);
  if (result.error) throw new Error(result.error);
  if (!result.imageUrl) throw new Error("No image URL in response");
  return result.imageUrl;
}

export async function generateSceneVideoViaHiggsfield(
  imageUrl: string,
  motionPrompt: string
): Promise<string> {
  const prompt = `Use the generate_video tool with these exact parameters:
- model: "seedance_2_0"
- duration: 4
- aspect_ratio: "9:16"
- medias: [{"role": "start_image", "value": "${imageUrl}"}]
- prompt: "${motionPrompt.replace(/"/g, "'")}"

After submitting, poll job_status (with sync: true) until done.
Return ONLY a JSON object: {"videoUrl": "<output_video_url>"}`;

  const result = await callHiggsfieldViaClaude(prompt);
  if (result.error) throw new Error(result.error);
  if (!result.videoUrl) throw new Error("No video URL in response");
  return result.videoUrl;
}
