// app/api/voices/preview/route.ts

import { NextResponse }  from "next/server"
import { getSession }    from "@/lib/auth/session"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthenticated." }, { status: 401 })
  }

  const { voiceName } = await req.json()
  if (!voiceName) {
    return NextResponse.json({ error: "voiceName required." }, { status: 422 })
  }

  const baseUrl = process.env.EDGE_TTS_BASE_URL
  const apiKey  = process.env.EDGE_TTS_API_KEY

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      { error: "Edge TTS not configured." },
      { status: 500 }
    )
  }

  const PREVIEW_TEXT: Record<string, string> = {
    "bn": "হ্যালো! এটি Vocera AI থেকে আমার কণ্ঠস্বরের একটি নমুনা।",
    "hi": "नमस्ते! यह Vocera AI से मेरी आवाज़ का एक नमूना है।",
    "ar": "مرحباً! هذا مثال على صوتي من Vocera AI.",
    "fr": "Bonjour! Ceci est un exemple de ma voix sur Vocera AI.",
    "de": "Hallo! Das ist ein Beispiel meiner Stimme von Vocera AI.",
    "ja": "こんにちは！これはVocera AIの私の声のサンプルです。",
    "zh": "你好！这是我在Vocera AI上的声音示例。",
    "es": "¡Hola! Esta es una muestra de mi voz en Vocera AI.",
    "ko": "안녕하세요! 이것은 Vocera AI의 내 목소리 샘플입니다.",
  }

  // Locale থেকে language code বের করো
  const locale = voiceName.split("-")[0]?.toLowerCase() ?? "en"
  const text   = PREVIEW_TEXT[locale] ??
                 "Hello! This is a sample of my voice from Vocera AI."

  try {
    const res = await fetch(`${baseUrl}/v1/audio/speech`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:           "tts-1",
        input:           text,
        voice:           voiceName,
        response_format: "mp3",
        speed:           1.0,
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[voices/preview] Edge TTS error:", err)
      return NextResponse.json(
        { error: "Preview generation failed." },
        { status: 502 }
      )
    }

    const buffer = await res.arrayBuffer()

    return new Response(buffer, {
      headers: {
        "Content-Type":  "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (err) {
    console.error("[voices/preview] Error:", err)
    return NextResponse.json(
      { error: "Preview generation failed." },
      { status: 500 }
    )
  }
}