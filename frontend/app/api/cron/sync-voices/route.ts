import { syncElVoices } from "@/lib/elevenLab/el-sync-jobs/sync-voices/sync-voices";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // voice sync can take a few minutes

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Support ?type=incremental from manual triggers
  const url = new URL(req.url);
  const syncType =
    url.searchParams.get("type") === "incremental" ? "incremental" : "full";

  try {
    await syncElVoices(syncType);
    return NextResponse.json({ ok: true, syncType });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-voices] failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}