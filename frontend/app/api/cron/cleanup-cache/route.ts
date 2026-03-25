import { cleanupExpiredCache } from "@/lib/tts/cache";
import { NextResponse } from "next/server";

export const runtime    = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { deleted } = await cleanupExpiredCache();
    console.log(`[cleanup-cache] Deleted ${deleted} expired cache entries.`);
    return NextResponse.json({ ok: true, deleted });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cleanup-cache] Failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}