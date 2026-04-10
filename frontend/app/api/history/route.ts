import { NextResponse }    from "next/server"
import { getSession }      from "@/lib/auth/session"
import prisma              from "@/lib/auth/prisma"
import { generateSignedUrl } from "@/lib/storage/r2"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const search    = searchParams.get("q")         ?? ""
  const provider  = searchParams.get("provider")  ?? "all"
  const period    = searchParams.get("period")    ?? "all"
  const sort      = searchParams.get("sort")      ?? "newest"
  const page      = parseInt(searchParams.get("page") ?? "1", 10)
  const limit     = 18   // 3 col × 6 rows

  // ── Date filter ──────────────────────────────────────────────
  const now   = new Date()
  let dateGte: Date | undefined

  if (period === "today") {
    dateGte = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (period === "week") {
    dateGte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else if (period === "month") {
    dateGte = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  // ── Sort ──────────────────────────────────────────────────────
  const orderBy =
    sort === "oldest"   ? { createdAt: "asc"  as const } :
    sort === "longest"  ? { audioFile: { durationSeconds: "desc" as const } } :
                          { createdAt: "desc" as const }

  // ── Where ─────────────────────────────────────────────────────
  const where = {
    userId,
    status:    "completed" as const,
    audioFile: { deletedAt: null },
    ...(search   && { inputText: { contains: search, mode: "insensitive" as const } }),
    ...(dateGte  && { createdAt: { gte: dateGte } }),
    ...(provider !== "all" && {
      voiceModel: { provider },
    }),
  }

  const [items, total] = await Promise.all([
    prisma.ttsRequest.findMany({
      where,
      select: {
        id:             true,
        inputText:      true,
        charCount:      true,
        outputFormat:   true,
        createdAt:      true,
        servedFromCache: true,
        voiceModel: {
          select: {
            name:         true,
            provider:     true,
            edgeVoiceName: true,
          },
        },
        audioFile: {
          select: {
            id:              true,
            storageKey:      true,
            signedUrl:       true,
            signedUrlExpiresAt: true,
            fileSizeBytes:   true,
            durationSeconds: true,
            fileFormat:      true,
          },
        },
      },
      orderBy,
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.ttsRequest.count({ where }),
  ])

  // ── Refresh stale signed URLs ─────────────────────────────────
  const threshold = new Date(Date.now() + 10 * 60 * 1000)   // 10 min buffer
  const refreshed = await Promise.all(
    items.map(async (item) => {
      const af = item.audioFile
      if (!af) return { ...item, freshUrl: null }

      if (
        af.signedUrl &&
        af.signedUrlExpiresAt &&
        af.signedUrlExpiresAt > threshold
      ) {
        return { ...item, freshUrl: af.signedUrl }
      }

      const { url, expiresAt } = await generateSignedUrl(af.storageKey)
      await prisma.audioFile.update({
        where: { id: af.id },
        data:  { signedUrl: url, signedUrlExpiresAt: expiresAt },
      })
      return { ...item, freshUrl: url }
    })
  )

  return NextResponse.json({
    items:    refreshed,
    total,
    page,
    pages:    Math.ceil(total / limit),
    hasMore:  page * limit < total,
  })
}