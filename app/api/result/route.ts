import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

const BUCKET = "cineamore";

export async function GET(req: NextRequest) {
  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(`jobs/${jobId}/final.mp4`, 7 * 24 * 3600);

  if (error || !data) {
    return NextResponse.json({ error: "Video not ready yet" }, { status: 404 });
  }

  return NextResponse.json({ videoUrl: data.signedUrl });
}
