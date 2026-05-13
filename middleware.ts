import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(list) {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refresh session — keep it alive on every request
  await supabase.auth.getUser();

  // Auto language: Turkey → Turkish, elsewhere → English
  if (!req.cookies.get("lang")) {
    const country = req.headers.get("x-vercel-ip-country") ?? "TR";
    const lang = country === "TR" ? "tr" : "en";
    res.cookies.set("lang", lang, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
