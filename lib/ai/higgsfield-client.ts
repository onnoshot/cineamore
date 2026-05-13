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
  const controller = new AbortController();
  // 90s timeout: Higgsfield image gen takes ~15-30s; polling is handled separately
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

  let res: Response;
  try {
    res = await fetch(MCP_URL, {
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
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MCP HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const raw = await res.text();

  function extractFromParsed(parsed: unknown): string | null {
    const p = parsed as Record<string, unknown>;
    if (p.error) {
      const err = p.error as Record<string, unknown>;
      throw new Error(String(err.message ?? JSON.stringify(p.error)));
    }
    const result = p.result as Record<string, unknown> | undefined;
    if (result?.content && Array.isArray(result.content)) {
      const text = (result.content as Array<{ type: string; text?: string }>)
        .filter((c) => c.type === "text" && c.text)
        .map((c) => c.text!)
        .join("\n");
      if (text) return text;
    }
    if (typeof result === "string") return result;
    return null;
  }

  // Try plain JSON first (some endpoints return non-SSE)
  try {
    const json = JSON.parse(raw);
    const text = extractFromParsed(json);
    if (text) return text;
  } catch { /* not plain JSON — fall through to SSE parsing */ }

  // Parse SSE stream: each event is "data: {...json...}"
  for (const line of raw.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    let parsed: unknown;
    try { parsed = JSON.parse(line.slice(6)); } catch { continue; }
    const text = extractFromParsed(parsed);
    if (text !== null) return text;
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

/** Poll job_status until output URL is available.
 * sync:true is sent but may not block server-side via HTTP transport;
 * we use adaptive back-off: 4s → 6s → 8s → 10s, max 20 min total. */
async function waitForOutput(jobId: string): Promise<string> {
  const TIMEOUT_MS = 20 * 60 * 1000; // 20 min hard ceiling
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < TIMEOUT_MS) {
    const result = await callMcpTool("job_status", { jobId, sync: true });

    // Check for output URL
    const url = extractMediaUrl(result);
    if (url) return url;

    // Check for any terminal failure state
    if (/\b(fail(ed)?|error|cancelled?|rejected|invalid|timeout)\b/i.test(result)) {
      throw new Error(`Higgsfield job failed: ${result.slice(0, 300)}`);
    }

    attempt++;
    // Adaptive back-off: start at 4s, ramp to 10s after a few attempts
    const gap = Math.min(4000 + attempt * 1000, 10000);
    console.log(`[higgsfield] job ${jobId} attempt ${attempt} pending, next in ${gap}ms`);
    await new Promise((r) => setTimeout(r, gap));
  }

  throw new Error(`Higgsfield job ${jobId} timed out after ${Math.round((Date.now() - start) / 60000)} min`);
}

/**
 * Generate a soul_2 character portrait from a face photo.
 * Returns the Higgsfield job ID (used as reference in scene generation).
 * soul_2 is Higgsfield's identity-preserving character model.
 */
export async function generateCharacterPortrait(
  photoUrl: string,
): Promise<string> {
  const result = await callMcpTool("generate_image", {
    params: {
      model: "soul_2",
      prompt: "Cinematic character portrait, photorealistic, natural lighting, identity preserved, detailed facial features",
      aspect_ratio: "9:16",
      medias: [{ role: "image", value: photoUrl }],
    },
  });

  const jobId = extractJobId(result);
  await waitForOutput(jobId); // confirm completion before using as reference
  return jobId;
}

/**
 * Generate a scene image using image_auto with two soul_2 portrait job IDs.
 * Job IDs (not CDN URLs) must be used — Higgsfield CDN returns binary/octet-stream
 * which the API rejects when used as reference inputs.
 */
export async function generateSceneImageViaHiggsfield(
  scenePrompt: string,
  manPortraitJobId: string,
  womanPortraitJobId: string
): Promise<string> {
  const result = await callMcpTool("generate_image", {
    params: {
      model: "image_auto",
      prompt: scenePrompt,
      aspect_ratio: "9:16",
      medias: [
        { role: "image", value: manPortraitJobId },
        { role: "image", value: womanPortraitJobId },
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
      mode: "fast",
      medias: [{ role: "start_image", value: imageUrl }],
    },
  });

  const directUrl = extractMediaUrl(result);
  if (directUrl) return directUrl;

  const jobId = extractJobId(result);
  return waitForOutput(jobId);
}
