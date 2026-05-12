import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ credits: 0 });

  const supabase = getAdmin();
  // Check both registrations (legacy) and profiles (new)
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, videos_created, is_vip")
    .eq("email", email)
    .maybeSingle();

  const { data: reg } = await supabase
    .from("registrations")
    .select("credits, videos_created, is_vip")
    .eq("email", email)
    .maybeSingle();

  const d = profile ?? reg;
  return NextResponse.json({
    credits: d?.credits ?? 0,
    videosCreated: d?.videos_created ?? 0,
    isVip: d?.is_vip ?? false,
  });
}
