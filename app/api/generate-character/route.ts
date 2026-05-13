import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const DEMO_PORTRAIT_JOB_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(req: NextRequest) {
  try {
    const { photoUrl } = await req.json() as { photoUrl: string };

    if (!photoUrl) {
      return NextResponse.json({ error: "photoUrl required" }, { status: 400 });
    }

    if (process.env.DEMO_MODE === "true") {
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json({ portraitJobId: DEMO_PORTRAIT_JOB_ID });
    }

    const { generateCharacterPortrait } = await import("@/lib/ai/higgsfield-client");
    const portraitJobId = await generateCharacterPortrait(photoUrl);

    return NextResponse.json({ portraitJobId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate-character]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
