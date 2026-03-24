import { snapshotElUsage } from "@/lib/elevenLab/el-sync-jobs/sync-usage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await snapshotElUsage();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-usage] failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}