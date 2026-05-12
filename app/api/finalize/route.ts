import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { join } from "path";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

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
    const { jobId, videoUrls, email } = await req.json() as { jobId: string; videoUrls: string[]; email?: string };

    if (!jobId || !videoUrls || videoUrls.length !== 4) {
      return NextResponse.json({ error: "jobId and 4 videoUrls required" }, { status: 400 });
    }

    // Demo mode: return placeholder video
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 2000));
      return NextResponse.json({ finalVideoUrl: DEMO_FINAL_VIDEO, jobId });
    }

    const { concatVideosWithAudio } = await import("@/lib/video/ffmpeg-concat");
    const supabaseAdmin = getAdmin();

    // Download music from Supabase if available
    let audioPath: string | null = null;
    let tempAudioPath: string | null = null;
    const { data: musicData, error: musicErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .download("admin/music.mp3");

    if (!musicErr && musicData) {
      tempAudioPath = join(tmpdir(), `music-${randomUUID()}.mp3`);
      await writeFile(tempAudioPath, Buffer.from(await musicData.arrayBuffer()));
      audioPath = tempAudioPath;
    } else {
      console.log("[finalize] No admin music found, skipping audio");
    }

    const finalBuffer = await concatVideosWithAudio(videoUrls, audioPath);

    if (tempAudioPath) {
      await unlink(tempAudioPath).catch(() => {});
    }

    const finalPath = `jobs/${jobId}/final.mp4`;
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(finalPath, finalBuffer, { contentType: "video/mp4", upsert: true });

    if (error) throw new Error(`Final upload error: ${error.message}`);

    const { data: signedData, error: signedErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(finalPath, 7 * 24 * 3600);

    if (signedErr || !signedData) throw new Error("Could not create signed URL");

    // Decrement user credits after successful generation (VIP users are exempt)
    if (email) {
      try {
        const { data: reg } = await supabaseAdmin
          .from("registrations")
          .select("credits, videos_created, is_vip")
          .eq("email", email)
          .single();

        if (reg) {
          await supabaseAdmin
            .from("registrations")
            .update({
              credits: reg.is_vip ? reg.credits : Math.max(0, (reg.credits ?? 1) - 1),
              videos_created: (reg.videos_created ?? 0) + 1,
            })
            .eq("email", email);
        }
      } catch { /* non-critical — video still delivered */ }
    }

    return NextResponse.json({ finalVideoUrl: signedData.signedUrl, jobId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[finalize]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
