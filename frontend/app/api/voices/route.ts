import { NextResponse } from "next/server"
import prisma           from "@/lib/auth/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const search   = searchParams.get("q")          ?? ""
  const lang     = searchParams.get("lang")        ?? "all"
  const gender   = searchParams.get("gender")      ?? "all"
  const provider = searchParams.get("provider")    ?? "all"
  const page     = parseInt(searchParams.get("page") ?? "1", 10)
  const limit    = 24

  const where = {
    isActive:       true,
    sampleAudioUrl: { not: null },         // sample আছে এমন voice
    ...(search && {
      OR: [
        { edgeVoiceName:    { contains: search, mode: "insensitive" as const } },
        { edgeFriendlyName: { contains: search, mode: "insensitive" as const } },
        { language: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(provider !== "all" && { provider }),
    ...(gender   !== "all" && {
      OR: [
        { gender:     { equals: gender,   mode: "insensitive" as const } },
        { edgeGender: { equals: gender,   mode: "insensitive" as const } },
      ],
    }),
    ...(lang !== "all" && {
      language: { code: { startsWith: lang } },
    }),
  }

  const [voices, total, languages] = await Promise.all([
    prisma.voiceModel.findMany({
      where,
      select: {
        id:               true,
        name:             true,
        provider:         true,
        gender:           true,
        isPremium:        true,
        styleTags:        true,
        sampleAudioUrl:   true,
        edgeVoiceName:    true,
        edgeFriendlyName: true,
        edgeLocale:       true,
        edgeGender:       true,
        language: {
          select: { code: true, name: true, nativeName: true },
        },
      },
      orderBy: [
        { isPremium:  "desc" },
        { sortOrder:  "asc"  },
        { edgeLocale: "asc"  },
      ],
      skip:  (page - 1) * limit,
      take:  limit,
    }),

    prisma.voiceModel.count({ where }),

    // Distinct language list for filter
    prisma.language.findMany({
      where: {
        voiceModels: {
          some: { isActive: true, sampleAudioUrl: { not: null } },
        },
      },
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return NextResponse.json(
    {
      voices,
      total,
      page,
      pages:   Math.ceil(total / limit),
      hasMore: page * limit < total,
      languages,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  )
}