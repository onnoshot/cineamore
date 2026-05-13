import { NextRequest, NextResponse } from "next/server";
import { getScenesForCity } from "@/lib/ai/prompts";

const DEMO_MODE = process.env.DEMO_MODE === "true";

const DEMO_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { sceneIndex, imageUrl, city } = await req.json();

    if (sceneIndex < 0 || sceneIndex > 3) {
      return NextResponse.json({ error: "Invalid sceneIndex" }, { status: 400 });
    }

    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      return NextResponse.json({ videoUrl: DEMO_VIDEO_URL, sceneIndex });
    }

    const scene = getScenesForCity(city)[sceneIndex as 0 | 1 | 2 | 3];
    const { submitSceneVideoJob } = await import("@/lib/ai/higgsfield-client");

    // Submit job and return immediately — client will poll for completion
    const { jobId: higgsfieldJobId, directUrl } = await submitSceneVideoJob(
      imageUrl, scene.videoPrompt
    );

    if (directUrl) {
      return NextResponse.json({ videoUrl: directUrl, sceneIndex });
    }

    return NextResponse.json({ higgsfieldJobId, sceneIndex });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-video]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
