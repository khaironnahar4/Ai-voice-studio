import { syncEdgeVoices } from "@/lib/edge/edge-voices-sync"
import { NextResponse }      from "next/server"

export const runtime     = "nodejs"
export const maxDuration = 120

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await syncEdgeVoices()
    console.log("[sync-edge-voices]", result)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[sync-edge-voices] failed:", msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}