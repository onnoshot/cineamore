import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SCENES } from "@/lib/ai/prompts";

const DEMO_MODE = process.env.DEMO_MODE === "true";
const BUCKET = "cineamore";

// 12-second creative commons sample video (Big Buck Bunny clip)
const DEMO_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, i)));
    }
  }
  throw new Error("unreachable");
}

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { jobId, sceneIndex, imageUrl } = await req.json();

    if (sceneIndex < 0 || sceneIndex > 3) {
      return NextResponse.json({ error: "Invalid sceneIndex" }, { status: 400 });
    }

    // Demo mode: return placeholder video
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 3000 + sceneIndex * 800));
      return NextResponse.json({ videoUrl: DEMO_VIDEO_URL, sceneIndex });
    }

    const scene = SCENES[sceneIndex as 0 | 1 | 2 | 3];

    const { generateSceneVideoViaHiggsfield } = await import("@/lib/ai/higgsfield-client");

    const videoUrl = await withRetry(() =>
      generateSceneVideoViaHiggsfield(imageUrl, scene.videoPrompt)
    );

    // Store in Supabase
    const supabaseAdmin = getAdmin();
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error("Could not download generated video");
    const buffer = Buffer.from(await res.arrayBuffer());
    const path = `jobs/${jobId}/video${sceneIndex}.mp4`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: "video/mp4", upsert: true });

    if (error) throw new Error(`Storage error: ${error.message}`);

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ videoUrl: data.publicUrl, sceneIndex });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-video]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
