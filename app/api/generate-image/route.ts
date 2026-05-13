import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getScenesForCity } from "@/lib/ai/prompts";

const DEMO_MODE = process.env.DEMO_MODE === "true";
const BUCKET = "cineamore";

const DEMO_IMAGES = [
  "https://images.pexels.com/photos/3389587/pexels-photo-3389587.jpeg?w=1024",
  "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?w=1024",
  "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?w=1024",
  "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?w=1024",
];

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export const maxDuration = 300;

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1500 * Math.pow(2, i)));
    }
  }
  throw new Error("unreachable");
}

export async function POST(req: NextRequest) {
  try {
    const { jobId, sceneIndex, manUrl, womanUrl, city } = await req.json();

    if (sceneIndex < 0 || sceneIndex > 3) {
      return NextResponse.json({ error: "Invalid sceneIndex" }, { status: 400 });
    }

    // Demo mode: return placeholder image immediately
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 1500 + sceneIndex * 500));
      return NextResponse.json({ imageUrl: DEMO_IMAGES[sceneIndex], sceneIndex });
    }

    const scene = getScenesForCity(city)[sceneIndex as 0 | 1 | 2 | 3];

    const { generateSceneImageViaHiggsfield } = await import("@/lib/ai/higgsfield-client");

    const imageUrl = await withRetry(() =>
      generateSceneImageViaHiggsfield(scene.imagePrompt, manUrl, womanUrl)
    );

    // Store in Supabase
    const supabaseAdmin = getAdmin();
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error("Could not fetch generated image");
    const buffer = Buffer.from(await res.arrayBuffer());
    const path = `jobs/${jobId}/scene${sceneIndex}.webp`;

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: "image/webp", upsert: true });

    if (error) throw new Error(`Storage upload error: ${error.message}`);

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ imageUrl: data.publicUrl, sceneIndex });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-image]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
