import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "cineamore";
const SIGNED_URL_TTL = 7 * 24 * 3600; // 7 days

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

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getAdmin();

    // List all job folders under jobs/
    const { data: folders, error: listErr } = await supabase.storage
      .from(BUCKET)
      .list("jobs", { limit: 200, sortBy: { column: "created_at", order: "desc" } });

    if (listErr) throw listErr;
    if (!folders || folders.length === 0) return NextResponse.json({ videos: [] });

    // For each job folder, check if final.mp4 exists and get signed URL
    const results = await Promise.all(
      folders.map(async (folder) => {
        const jobId = folder.name;
        const finalPath = `jobs/${jobId}/final.mp4`;

        const { data: signed, error: signErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(finalPath, SIGNED_URL_TTL);

        if (signErr || !signed) return null;

        // Get file metadata
        const { data: files } = await supabase.storage
          .from(BUCKET)
          .list(`jobs/${jobId}`, { search: "final.mp4" });

        const file = files?.find((f) => f.name === "final.mp4");

        return {
          jobId,
          url: signed.signedUrl,
          size: file?.metadata?.size ?? null,
          createdAt: file?.created_at ?? folder.created_at ?? null,
        };
      })
    );

    const videos = results.filter(Boolean);
    return NextResponse.json({ videos, total: videos.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
