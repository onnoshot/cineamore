import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { randomUUID } from "crypto";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const BUCKET = "cineamore";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const manFile = formData.get("man") as File | null;
    const womanFile = formData.get("woman") as File | null;
    const email = (formData.get("email") as string | null)?.trim().toLowerCase();

    if (!manFile || !womanFile) {
      return NextResponse.json({ error: "Both images required" }, { status: 400 });
    }

    const jobId = randomUUID();
    const supabaseAdmin = getAdmin();

    // Check credits (VIP users bypass the limit)
    if (email) {
      // Check profiles table first (new auth system), fall back to registrations (legacy)
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("credits, is_vip")
        .eq("email", email)
        .maybeSingle();

      const { data: reg } = profile ? { data: null } : await supabaseAdmin
        .from("registrations")
        .select("credits, is_vip")
        .eq("email", email)
        .maybeSingle();

      const userRec = profile ?? reg;
      const isVip = userRec?.is_vip ?? false;
      if (!isVip) {
        const credits = userRec?.credits ?? 0;
        if (credits <= 0) {
          return NextResponse.json({ error: "credits_exhausted", creditsRemaining: 0 }, { status: 402 });
        }
      }
    }

    async function processImage(file: File, role: string): Promise<string> {
      const bytes = await file.arrayBuffer();
      const resized = await sharp(Buffer.from(bytes))
        .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 88 })
        .toBuffer();

      const path = `jobs/${jobId}/${role}.webp`;
      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, resized, { contentType: "image/webp", upsert: true });

      if (error) throw new Error(`Upload error: ${error.message}`);

      const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      return data.publicUrl;
    }

    const [manUrl, womanUrl] = await Promise.all([
      processImage(manFile, "man"),
      processImage(womanFile, "woman"),
    ]);

    // Schedule cleanup after 1h (via database trigger or edge function in production)
    // For now we store jobId for reference

    return NextResponse.json({ jobId, manUrl, womanUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[prepare]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
