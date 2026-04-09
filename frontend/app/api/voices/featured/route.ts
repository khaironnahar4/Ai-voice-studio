import { NextResponse } from "next/server"
import prisma           from "@/lib/auth/prisma"

const FEATURED_LOCALES = [
  "en-US", "en-GB", "bn-BD", "bn-IN",
  "hi-IN", "ar-SA", "fr-FR", "es-ES",
  "de-DE", "ja-JP", "zh-CN", "pt-BR",
]

export async function GET() {
  try {
    const voices = await prisma.voiceModel.findMany({
      where: {
        provider:    "edge",
        isActive:    true,
        edgeLocale:  { in: FEATURED_LOCALES },
        sampleAudioUrl: { not: null },
      },
      select: {
        id:             true,
        name:           true,
        gender:         true,
        accent:         true,
        styleTags:      true,
        isPremium:      true,
        sampleAudioUrl: true,   // ← this is the key
        edgeVoiceName:  true,
        edgeLocale:     true,
        edgeGender:     true,
        edgeFriendlyName: true,
        language: {
          select: { code: true, name: true, nativeName: true },
        },
      },
      orderBy: [
        { isPremium: "desc" },
        { sortOrder: "asc"  },
      ],
    })

    // Locale per দেখো — একটা করে voice
    const seen     = new Set<string>()
    const featured = voices.filter(v => {
      const locale = v.edgeLocale ?? ""
      if (seen.has(locale)) return false
      seen.add(locale)
      return true
    })

    const result = featured.map(v => ({
      id:             v.id,
      voiceName:      v.edgeVoiceName,
      friendlyName:   v.edgeFriendlyName ?? v.name,
      locale:         v.edgeLocale,
      gender:         v.edgeGender ?? v.gender,
      styleTags:      v.styleTags.slice(0, 3),
      isPremium:      v.isPremium,
      sampleAudioUrl: v.sampleAudioUrl,   // ← R2 public URL
      language: {
        code:       v.language?.code,
        name:       v.language?.name,
        nativeName: v.language?.nativeName,
      },
    }))

    return NextResponse.json(
      { voices: result },
      {
        headers: {
          // Voices rarely change — 1 hour cache
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    )
  } catch (err) {
    console.error("[api/voices/featured]", err)
    return NextResponse.json({ error: "Failed to load voices." }, { status: 500 })
  }
}