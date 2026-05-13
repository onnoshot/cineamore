import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

const BUCKET = "cineamore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string; role: string }> }
) {
  const { jobId, role } = await params;

  if (!["man", "woman"].includes(role)) {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(`jobs/${jobId}/${role}.webp`);

  const res = await fetch(data.publicUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "image not found" }, { status: 404 });
  }

  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
