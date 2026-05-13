import { NextRequest, NextResponse } from "next/server";
import { getScenesForCity } from "@/lib/ai/prompts";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const DEMO_IMAGES = [
  "https://images.pexels.com/photos/3389587/pexels-photo-3389587.jpeg?w=1024",
  "https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg?w=1024",
  "https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg?w=1024",
  "https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?w=1024",
];

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body = await req.json();
    const { sceneIndex, manUrl, womanUrl, city } = body as {
      sceneIndex: number; manUrl: string; womanUrl: string; city: string | null;
    };

    console.log(`[generate-image] scene=${sceneIndex} manUrl=${manUrl?.slice(0, 60)} city=${city}`);

    if (sceneIndex < 0 || sceneIndex > 3) {
      return NextResponse.json({ error: "Invalid sceneIndex" }, { status: 400 });
    }

    if (!manUrl || !womanUrl) {
      return NextResponse.json({ error: "manUrl and womanUrl required" }, { status: 400 });
    }

    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({ imageUrl: DEMO_IMAGES[sceneIndex], sceneIndex });
    }

    const scene = getScenesForCity(city)[sceneIndex as 0 | 1 | 2 | 3];
    console.log(`[generate-image] calling Higgsfield for scene ${sceneIndex}…`);

    const { submitSceneImageJob } = await import("@/lib/ai/higgsfield-client");

    const { jobId: higgsfieldJobId, directUrl } = await submitSceneImageJob(
      scene.imagePrompt, manUrl, womanUrl
    );

    console.log(`[generate-image] scene=${sceneIndex} done in ${Date.now()-t0}ms jobId=${higgsfieldJobId} directUrl=${!!directUrl}`);

    if (directUrl) {
      return NextResponse.json({ imageUrl: directUrl, sceneIndex });
    }

    return NextResponse.json({ higgsfieldJobId, sceneIndex });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[generate-image] FAILED in ${Date.now()-t0}ms:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
