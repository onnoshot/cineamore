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
  const { data } = await supabase
    .from("registrations")
    .select("credits, videos_created")
    .eq("email", email)
    .single();

  return NextResponse.json({
    credits: data?.credits ?? 0,
    videosCreated: data?.videos_created ?? 0,
  });
}
