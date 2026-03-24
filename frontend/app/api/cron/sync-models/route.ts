import { syncElModels } from "@/lib/elevenLab/el-sync-jobs/sync-models";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  // Guard: only Vercel Cron or your own calls with the secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncElModels();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[sync-models] failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}