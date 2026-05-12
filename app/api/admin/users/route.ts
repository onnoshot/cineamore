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

const CURRENT_YEAR = 2026;

const AGE_GROUPS = [
  { label: "18–25", min: CURRENT_YEAR - 25, max: CURRENT_YEAR - 18 },
  { label: "26–35", min: CURRENT_YEAR - 35, max: CURRENT_YEAR - 26 },
  { label: "36–45", min: CURRENT_YEAR - 45, max: CURRENT_YEAR - 36 },
  { label: "46–55", min: CURRENT_YEAR - 55, max: CURRENT_YEAR - 46 },
  { label: "55+",   min: 1920,              max: CURRENT_YEAR - 56 },
];

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getAdmin();

    // Fetch from both tables and merge (profiles = new auth users, registrations = legacy)
    const [{ data: profileUsers }, { data: regUsers }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, city, birth_year, created_at, is_vip, credits, videos_created").order("created_at", { ascending: false }),
      supabase.from("registrations").select("id, full_name, email, city, birth_year, created_at, is_vip, credits, videos_created").order("created_at", { ascending: false }),
    ]);

    // Merge, deduplicate by email
    const emailsSeen = new Set<string>();
    const allUsers = [...(profileUsers ?? []), ...(regUsers ?? [])].filter((u) => {
      if (!u.email || emailsSeen.has(u.email)) return false;
      emailsSeen.add(u.email);
      return true;
    });

    const users = allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const error = null;

    if (error) throw error;

    const total = users?.length ?? 0;

    // City distribution (top 8)
    const cityMap: Record<string, number> = {};
    users?.forEach((u) => {
      const c = u.city?.trim() || "—";
      cityMap[c] = (cityMap[c] ?? 0) + 1;
    });
    const cities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([city, count]) => ({ city, count }));

    // Age groups
    const ageGroups = AGE_GROUPS.map((g) => ({
      label: g.label,
      count: users?.filter((u) => u.birth_year >= g.min && u.birth_year <= g.max).length ?? 0,
    }));

    // Daily trend — last 7 days
    const trend: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trend[d.toISOString().slice(0, 10)] = 0;
    }
    users?.forEach((u) => {
      const day = u.created_at?.slice(0, 10);
      if (day && trend[day] !== undefined) trend[day]++;
    });
    const dailyTrend = Object.entries(trend).map(([date, count]) => ({ date, count }));

    // This week count
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = users?.filter((u) => new Date(u.created_at) >= weekAgo).length ?? 0;

    // Average birth year → age
    const avgAge = total > 0
      ? Math.round(users!.reduce((s, u) => s + (CURRENT_YEAR - u.birth_year), 0) / total)
      : 0;

    return NextResponse.json({ users, stats: { total, thisWeek, avgAge, cities, ageGroups, dailyTrend } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
