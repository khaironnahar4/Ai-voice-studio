import { NextResponse } from "next/server"
import prisma           from "@/lib/auth/prisma"

const FEATURED_LOCALES = [
  "en-US", "en-GB", "bn-BD", "bn-IN",
  "hi-IN", "ar-SA", "fr-FR", "es-ES",
  "de-DE", "ja-JP", "zh-CN", "pt-BR",
  // "es-MX",   "ru-RU",  "ko-KR", "it-IT",
  // "en-IN", "id-ID", "tr-TR", "vi-VN",
  // "ar-AE"
]

// const new_locale =[ "ar-KW","ta-LK","en-ZA", "cs-CZ", "en-SG","nl-NL", "hr-HR"  , "es-VE", "ro-RO", "en-CA", "ar-LY", "fr-FR", 
//   "en-NG", "ms-MY", "en-PH", "de-AT", "fr-BE", "es-UY", "en-KE", "bn-IN", "bg-BG", "uk-UA", "pt-BR", "de-CH", "ar-EG", "vi-VN",
//    "de-DE", "es-BO", "fa-IR", "bn-BD", "el-GR", "es-PA", "da-DK", "ko-KR", "ar-YE", "fr-CA", "ur-PK", "sk-SK", "ar-SA", "ar-LB", 
//    "en-NZ", "ar-BH", "es-MX", "pt-PT", "ar-SY", "ta-IN", "ar-DZ", "ur-IN", "pl-PL", "es-SV", "en-IN", "zh-CN-liaoning", "en-GB", 
//    "es-CU", "ar-OM", "ar-TN", "zh-CN-shaanxi", "en-IE", "he-IL", "nb-NO", "te-IN", "es-CL", "ar-QA", "en-US", "en-AU", "hu-HU", 
//    "es-HN", "hi-IN", "ar-IQ", "sv-SE", "es-EC", "zh-CN", "zh-TW", "id-ID", "tr-TR", "es-AR", "fr-CH", "ar-JO", "nl-BE", "th-TH", 
//    "ar-AE", "es-US", "es-PR", "ru-RU", "ja-JP", "es-GT", "ta-MY", "es-PY", "it-IT", "fi-FI", "en-HK", "ar-MA", "es-PE", "es-CR", 
//    "es-CO", "zh-HK", "es-NI", "es-ES", "es-DO", "es-GQ", "ta-SG", "ca-ES", "en-TZ", "ml-IN"
// ]


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