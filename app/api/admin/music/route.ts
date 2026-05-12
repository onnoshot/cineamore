import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "cineamore";
const MUSIC_PATH = "admin/music.mp3";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  const expected = process.env.ADMIN_PASSWORD ?? "";
  return expected.length > 0 && token === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getAdmin();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list("admin", { search: "music.mp3" });

    if (error) throw error;
    const file = data?.find((f) => f.name === "music.mp3");

    if (!file) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      size: file.metadata?.size ?? null,
      updatedAt: file.updated_at ?? null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getAdmin();
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([MUSIC_PATH]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("music") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No music file provided" }, { status: 400 });
    }

    if (!file.type.includes("audio") && !file.name.endsWith(".mp3")) {
      return NextResponse.json({ error: "Only MP3 files are accepted" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const supabase = getAdmin();

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(MUSIC_PATH, buffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      size: buffer.length,
      name: file.name,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
