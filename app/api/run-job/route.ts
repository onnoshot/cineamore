import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 300;

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

type SceneEntry = { status: string; imageUrl?: string; videoUrl?: string; error?: string };

async function setJobField(jobId: string, update: Record<string, unknown>) {
  await getAdmin()
    .from("jobs")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function patchScene(jobId: string, index: number, patch: Partial<SceneEntry>) {
  const supabase = getAdmin();
  const { data } = await supabase.from("jobs").select("scenes").eq("id", jobId).single();
  const scenes: SceneEntry[] = Array.isArray(data?.scenes)
    ? [...data.scenes]
    : [{ status: "idle" }, { status: "idle" }, { status: "idle" }, { status: "idle" }];
  scenes[index] = { ...scenes[index], ...patch };
  await supabase
    .from("jobs")
    .update({ scenes, updated_at: new Date().toISOString() })
    .eq("id", jobId);
}

async function runPipeline(
  jobId: string,
  manUrl: string,
  womanUrl: string,
  city: string | null,
  email: string | null,
  appUrl: string
) {
  try {
    // Step 1: Generate all 4 images in parallel
    await setJobField(jobId, { status: "generating_images" });
    await Promise.all([0, 1, 2, 3].map((i) => patchScene(jobId, i, { status: "generating-image" })));

    const imageUrls: string[] = new Array(4);
    await Promise.all(
      [0, 1, 2, 3].map(async (i) => {
        const res = await fetch(`${appUrl}/api/generate-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, sceneIndex: i, manUrl, womanUrl, city }),
        });
        const data = await res.json();
        if (!res.ok) {
          await patchScene(jobId, i, { status: "error", error: data.error ?? `Scene ${i} image failed` });
          throw new Error(data.error ?? `Scene ${i} image failed`);
        }
        imageUrls[i] = data.imageUrl;
        await patchScene(jobId, i, { status: "generating-video", imageUrl: data.imageUrl });
      })
    );

    // Step 2: Generate all 4 videos in parallel
    await setJobField(jobId, { status: "generating_videos" });

    const videoUrls: string[] = new Array(4);
    await Promise.all(
      imageUrls.map(async (imageUrl, i) => {
        const res = await fetch(`${appUrl}/api/generate-video`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, sceneIndex: i, imageUrl, city }),
        });
        const data = await res.json();
        if (!res.ok) {
          await patchScene(jobId, i, { status: "error", error: data.error ?? `Scene ${i} video failed` });
          throw new Error(data.error ?? `Scene ${i} video failed`);
        }
        videoUrls[i] = data.videoUrl;
        await patchScene(jobId, i, { status: "done", videoUrl: data.videoUrl });
      })
    );

    // Step 3: Finalize (ffmpeg concat + email)
    await setJobField(jobId, { status: "finalizing" });

    const finalRes = await fetch(`${appUrl}/api/finalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, videoUrls, email }),
    });
    const finalData = await finalRes.json();
    if (!finalRes.ok) throw new Error(finalData.error ?? "Finalize failed");

    await setJobField(jobId, { status: "done", final_video_url: finalData.finalVideoUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[run-job] pipeline failed:", msg);
    await setJobField(jobId, { status: "error", error: msg });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { jobId, manUrl, womanUrl, city, email } = await req.json() as {
      jobId: string;
      manUrl: string;
      womanUrl: string;
      city?: string | null;
      email?: string | null;
    };

    if (!jobId || !manUrl || !womanUrl) {
      return NextResponse.json({ error: "jobId, manUrl, womanUrl required" }, { status: 400 });
    }

    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;

    // Create job record immediately so status page can read it
    await getAdmin().from("jobs").upsert({
      id: jobId,
      user_email: email ?? null,
      status: "pending",
      scenes: [
        { status: "idle" },
        { status: "idle" },
        { status: "idle" },
        { status: "idle" },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Fire pipeline WITHOUT awaiting — returns 202 immediately.
    // Vercel continues running this function until pipeline completes or maxDuration.
    runPipeline(jobId, manUrl, womanUrl, city ?? null, email ?? null, appUrl).catch((err) =>
      console.error("[run-job] unhandled:", err)
    );

    return NextResponse.json({ ok: true, jobId }, { status: 202 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
