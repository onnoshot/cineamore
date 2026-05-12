import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, city, birthYear } = await req.json();

    if (!fullName || !email || !city || !birthYear) {
      return NextResponse.json({ error: "Tüm alanlar zorunlu" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Geçerli bir e-posta gir" }, { status: 400 });
    }

    const year = Number(birthYear);
    if (isNaN(year) || year < 1920 || year > 2010) {
      return NextResponse.json({ error: "Geçerli bir doğum yılı gir" }, { status: 400 });
    }

    const supabase = getAdmin();

    // Upsert — same email registers again: just update
    const { error } = await supabase.from("registrations").upsert(
      { full_name: fullName, email: email.toLowerCase().trim(), city, birth_year: year },
      { onConflict: "email" }
    );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Kayıt hatası";
    console.error("[register]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
