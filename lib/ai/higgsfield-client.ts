/**
 * Calls Higgsfield MCP directly over HTTP — no Claude intermediary.
 * The Claude-as-orchestrator approach returned template placeholders instead
 * of real URLs. Direct MCP HTTP calls are reliable and avoid that issue.
 */

const MCP_URL = "https://mcp.higgsfield.ai/mcp";

function getToken(): string {
  const token = process.env.HIGGSFIELD_MCP_TOKEN;
  if (!token) throw new Error("HIGGSFIELD_MCP_TOKEN not set");
  return token;
}

/** POST to MCP and parse SSE response → returns tool result text */
async function callMcpTool(name: string, args: Record<string, unknown>): Promise<string> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "Authorization": `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MCP HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const raw = await res.text();

  // Parse SSE stream: each event is "data: {...json...}"
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(line.slice(6)); } catch { continue; }

    const p = parsed as Record<string, unknown>;

    if (p.error) {
      const err = p.error as Record<string, unknown>;
      throw new Error(String(err.message ?? JSON.stringify(p.error)));
    }

    // Standard JSON-RPC result
    const result = p.result as Record<string, unknown> | undefined;
    if (result?.content && Array.isArray(result.content)) {
      return (result.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text" && c.text)
        .map((c) => c.text!)
        .join("\n");
    }

    // Direct result with text
    if (typeof result === "string") return result;
  }

  throw new Error(`No usable result in MCP response:\n${raw.slice(0, 400)}`);
}

/** Extract first UUID from text */
function extractJobId(text: string): string {
  const m = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  if (!m) throw new Error(`No job ID found in MCP response:\n${text.slice(0, 300)}`);
  return m[0];
}

/** Extract first media URL (image or video) from text */
function extractMediaUrl(text: string): string | null {
  // First try to find URLs with known media extensions
  const mediaMatch = text.match(/https:\/\/\S+?\.(mp4|webp|jpg|jpeg|png|gif|mov)(\?\S*)?/i);
  if (mediaMatch) return mediaMatch[0].replace(/[.,;)"']+$/, "");

  // Fallback: any https URL that looks like a CDN/storage URL
  const urlMatch = text.match(/https:\/\/(?:cdn|storage|assets|media|files|output)\S+/i);
  if (urlMatch) return urlMatch[0].replace(/[.,;)"']+$/, "");

  return null;
}

/** Poll job_status until output URL is available */
async function waitForOutput(jobId: string): Promise<string> {
  const MAX_ATTEMPTS = 50;
  let waitMs = 8000; // start at 8s, images complete in ~15-20s

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const result = await callMcpTool("job_status", { jobId, sync: true });

    // Check for output URL
    const url = extractMediaUrl(result);
    if (url) return url;

    // Check for failure
    if (/\b(fail|failed|error|cancelled|canceled)\b/i.test(result)) {
      throw new Error(`Higgsfield job failed: ${result.slice(0, 300)}`);
    }

    // Extract poll_after_seconds if provided
    const pollMatch = result.match(/poll_after[_\s]seconds[:\s]+(\d+)/i);
    if (pollMatch) waitMs = parseInt(pollMatch[1]) * 1000;
    else waitMs = Math.min(waitMs * 1.3, 25000); // increase up to 25s

    console.log(`[higgsfield] job ${jobId} attempt ${attempt + 1}, waiting ${waitMs}ms`);
    await new Promise((r) => setTimeout(r, waitMs));
  }

  throw new Error(`Higgsfield job ${jobId} timed out after ${MAX_ATTEMPTS} attempts`);
}

/** Generate a scene image using gpt_image_2 with two reference faces */
export async function generateSceneImageViaHiggsfield(
  scenePrompt: string,
  manImageUrl: string,
  womanImageUrl: string
): Promise<string> {
  const result = await callMcpTool("generate_image", {
    params: {
      model: "gpt_image_2",
      prompt: scenePrompt,
      aspect_ratio: "9:16",
      medias: [
        { role: "image", value: manImageUrl },
        { role: "image", value: womanImageUrl },
      ],
    },
  });

  // If URL is returned directly (sync model), use it
  const directUrl = extractMediaUrl(result);
  if (directUrl) return directUrl;

  // Otherwise poll by job ID
  const jobId = extractJobId(result);
  return waitForOutput(jobId);
}

/** Generate a 4-second scene video using seedance_2_0 from a still image */
export async function generateSceneVideoViaHiggsfield(
  imageUrl: string,
  motionPrompt: string
): Promise<string> {
  const result = await callMcpTool("generate_video", {
    params: {
      model: "seedance_2_0",
      prompt: motionPrompt,
      duration: 4,
      aspect_ratio: "9:16",
      medias: [{ role: "start_image", value: imageUrl }],
    },
  });

  const directUrl = extractMediaUrl(result);
  if (directUrl) return directUrl;

  const jobId = extractJobId(result);
  return waitForOutput(jobId);
}
