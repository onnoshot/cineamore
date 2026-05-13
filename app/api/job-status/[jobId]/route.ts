import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  const { data, error } = await getAdmin()
    .from("jobs")
    .select("id, status, scenes, final_video_url, error, updated_at")
    .eq("id", jobId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
