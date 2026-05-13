import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.HIGGSFIELD_MCP_TOKEN = process.env.HIGGSFIELD_MCP_TOKEN ? "set" : "MISSING";
  checks.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  checks.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ? "set" : "MISSING";

  // Try a lightweight Higgsfield call
  let higgsfield = "untested";
  try {
    const token = process.env.HIGGSFIELD_MCP_TOKEN;
    if (!token) throw new Error("token missing");

    const res = await fetch("https://mcp.higgsfield.ai/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "generate_image",
          arguments: {
            params: {
              model: "image_auto",
              prompt: "test",
              aspect_ratio: "9:16",
              get_cost: true,
            },
          },
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    higgsfield = res.ok ? `ok (${res.status})` : `error (${res.status})`;
  } catch (e: unknown) {
    higgsfield = `failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ checks, higgsfield });
}
