import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

function checkAuth(req: NextRequest): boolean {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim();
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return expected.length > 0 && token === expected;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, isVip } = await req.json() as { userId: string; isVip: boolean };
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const supabase = getAdmin();

  // Try profiles first (new auth users), then registrations (legacy)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ is_vip: isVip })
    .eq("id", userId);

  const { error: regError } = await supabase
    .from("registrations")
    .update({ is_vip: isVip })
    .eq("id", userId);

  // At least one table must succeed (user exists in one of them)
  if (profileError && regError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, isVip });
}
