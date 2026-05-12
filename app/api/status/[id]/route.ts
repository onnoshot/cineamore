import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
const BUCKET = "cineamore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;

  try {
    const supabaseAdmin = getAdmin();
    const checks = await Promise.allSettled([
      supabaseAdmin.storage.from(BUCKET).getPublicUrl(`jobs/${jobId}/scene0.webp`),
      supabaseAdmin.storage.from(BUCKET).getPublicUrl(`jobs/${jobId}/scene1.webp`),
      supabaseAdmin.storage.from(BUCKET).getPublicUrl(`jobs/${jobId}/scene2.webp`),
      supabaseAdmin.storage.from(BUCKET).getPublicUrl(`jobs/${jobId}/scene3.webp`),
      supabaseAdmin.storage.from(BUCKET).getPublicUrl(`jobs/${jobId}/video0.mp4`),
      supabaseAdmin.storage.from(BUCKET).getPublicUrl(`jobs/${jobId}/video1.mp4`),
      supabaseAdmin.storage.from(BUCKET).getPublicUrl(`jobs/${jobId}/video2.mp4`),
      supabaseAdmin.storage.from(BUCKET).getPublicUrl(`jobs/${jobId}/video3.mp4`),
    ]);

    const imagesReady = checks.slice(0, 4).filter((c) => c.status === "fulfilled").length;
    const videosReady = checks.slice(4).filter((c) => c.status === "fulfilled").length;

    const { data: finalUrl } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(`jobs/${jobId}/final.mp4`);

    return NextResponse.json({
      jobId,
      imagesReady,
      videosReady,
      finalUrl: finalUrl?.publicUrl ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
