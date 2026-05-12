import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { join } from "path";

const DEMO_MODE = process.env.DEMO_MODE === "true";
const DEMO_FINAL_VIDEO =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
const BUCKET = "cineamore";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { jobId, videoUrls } = await req.json() as { jobId: string; videoUrls: string[] };

    if (!jobId || !videoUrls || videoUrls.length !== 4) {
      return NextResponse.json({ error: "jobId and 4 videoUrls required" }, { status: 400 });
    }

    // Demo mode: return placeholder video
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({ finalVideoUrl: DEMO_FINAL_VIDEO, jobId });
    }

    const { concatVideosWithAudio } = await import("@/lib/video/ffmpeg-concat");
    const audioPath = join(process.cwd(), "public", "audio", "story_track.mp3");
    const supabaseAdmin = getAdmin();

    const finalBuffer = await concatVideosWithAudio(videoUrls, audioPath);

    const finalPath = `jobs/${jobId}/final.mp4`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(finalPath, finalBuffer, { contentType: "video/mp4", upsert: true });

    if (error) throw new Error(`Final upload error: ${error.message}`);

    const { data: signedData, error: signedErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(finalPath, 7 * 24 * 3600);

    if (signedErr || !signedData) throw new Error("Could not create signed URL");

    return NextResponse.json({ finalVideoUrl: signedData.signedUrl, jobId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[finalize]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
