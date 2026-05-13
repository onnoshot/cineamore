import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { higgsfieldJobId } = await req.json() as { higgsfieldJobId: string };

    if (!higgsfieldJobId) {
      return NextResponse.json({ error: "higgsfieldJobId required" }, { status: 400 });
    }

    const { pollHiggsfieldJobOnce } = await import("@/lib/ai/higgsfield-client");
    const result = await pollHiggsfieldJobOnce(higgsfieldJobId);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[poll-job]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
