import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const BUCKET = "cineamore";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") ?? "cinematic-love.vercel.app";
  const results: Record<string, unknown> = {
    version: "debug-pipeline-v3",
    host,
  };

  // 1. Env vars
  results.env = {
    HIGGSFIELD_TOKEN: process.env.HIGGSFIELD_MCP_TOKEN ? "SET" : "MISSING",
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING",
    SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? "SET" : "MISSING",
  };

  // 2. Upload tiny test image to Supabase
  const testJobId = `debug-${Date.now()}`;
  const testPath = `jobs/${testJobId}/man.webp`;
  // 1x1 transparent webp (smallest valid webp)
  const tinyWebp = Buffer.from(
    "52494646240000005745425056503820180000003001009d01" +
    "2a0100010002003425a500fedb0000000000",
    "hex"
  );
  try {
    const supabase = admin();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(testPath, tinyWebp, { contentType: "image/webp", upsert: true });
    results.supabase_upload = error ? `ERROR: ${error.message}` : `OK path=${testPath}`;
  } catch (e: unknown) {
    results.supabase_upload = `CRASH: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 3. Test proxy route (our own /api/img endpoint)
  const proxyUrl = `https://${host}/api/img/${testJobId}/man`;
  results.proxy_url = proxyUrl;
  try {
    const r = await fetch(proxyUrl, { signal: AbortSignal.timeout(10_000) });
    const ct = r.headers.get("content-type");
    results.proxy_fetch = `status=${r.status} content-type=${ct}`;
  } catch (e: unknown) {
    results.proxy_fetch = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
  }

  // 4. Test Higgsfield with our proxy URL
  const testUrl = `?gen=1` === new URL(req.url).search ? true
    : new URL(req.url).searchParams.get("gen") === "1";

  if (testUrl) {
    try {
      const token = process.env.HIGGSFIELD_MCP_TOKEN!;
      const body = JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "tools/call",
        params: {
          name: "generate_image",
          arguments: {
            params: {
              model: "cinematic_studio_2_5",
              prompt: "A couple walking, cinematic 9:16",
              aspect_ratio: "9:16",
              medias: [
                { role: "image", value: proxyUrl },
                { role: "image", value: proxyUrl },
              ],
            },
          },
        },
      });

      const hRes = await fetch("https://mcp.higgsfield.ai/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/event-stream",
          "Authorization": `Bearer ${token}`,
        },
        body,
        signal: AbortSignal.timeout(25_000),
      });
      const text = await hRes.text();
      results.higgsfield_with_proxy = `HTTP ${hRes.status}: ${text.slice(0, 400)}`;
    } catch (e: unknown) {
      results.higgsfield_with_proxy = `ERROR: ${e instanceof Error ? e.message : String(e)}`;
    }
  } else {
    results.higgsfield_with_proxy = "SKIPPED — add ?gen=1 to test Higgsfield (uses ~1 credit)";
  }

  // 5. Cleanup test upload
  try {
    await admin().storage.from(BUCKET).remove([testPath]);
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true, results }, { status: 200 });
}
