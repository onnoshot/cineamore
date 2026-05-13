import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const results: Record<string, string> = {};

  // 1. Env vars
  results.HIGGSFIELD_TOKEN = process.env.HIGGSFIELD_MCP_TOKEN ? "SET" : "MISSING";
  results.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING";
  results.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY ? "SET" : "MISSING";

  // 2. Vercel proxy URL this server would generate
  const host = req.headers.get("host") ?? "unknown";
  results.serverHost = host;
  results.proxyUrlExample = `https://${host}/api/img/test-job-id/man`;

  // 3. Test Higgsfield connectivity (lightweight — just list workspaces, no credit use)
  try {
    const token = process.env.HIGGSFIELD_MCP_TOKEN;
    if (!token) throw new Error("no token");
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
        method: "tools/list",
        params: {},
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    if (!res.ok) {
      results.higgsfield_tools_list = `HTTP ${res.status}: ${text.slice(0, 200)}`;
    } else {
      // just count tools
      const toolCount = (text.match(/"name"/g) || []).length;
      results.higgsfield_tools_list = `OK — ~${toolCount} tools listed`;
    }
  } catch (e: unknown) {
    results.higgsfield_tools_list = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. Test Supabase storage bucket accessibility
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    const { data, error } = await supabase.storage.from("cineamore").list("jobs", { limit: 1 });
    if (error) results.supabase_storage = `ERROR: ${error.message}`;
    else results.supabase_storage = `OK — ${data?.length ?? 0} items`;
  } catch (e: unknown) {
    results.supabase_storage = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 5. Test Higgsfield generate_image submit (costs ~1 credit — comment out if not needed)
  // Disabled by default to avoid wasting credits
  results.generate_image_test = "SKIPPED (enable manually if needed)";

  return NextResponse.json({ ok: true, results }, { status: 200 });
}
