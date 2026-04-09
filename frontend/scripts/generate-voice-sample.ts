// scripts/generate-voice-samples.ts

import prisma from "@/lib/auth/prisma"
import {
  uploadSampleAudio,
} from "@/lib/storage/r2"

// প্রতিটা locale এর জন্য নির্দিষ্ট sentence
const SAMPLE_TEXT: Record<string, string> = {
  "en":  "Hello! This is a sample of my voice from Vocera AI.",
  "bn":  "হ্যালো! এটি Vocera AI থেকে আমার কণ্ঠস্বরের একটি নমুনা।",
  "hi":  "नमस्ते! यह Vocera AI से मेरी आवाज़ का एक नमूना है।",
  "ar":  "مرحباً! هذا مثال على صوتي من Vocera AI.",
  "fr":  "Bonjour! Ceci est un exemple de ma voix sur Vocera AI.",
  "es":  "¡Hola! Esta es una muestra de mi voz en Vocera AI.",
  "de":  "Hallo! Das ist ein Beispiel meiner Stimme von Vocera AI.",
  "ja":  "こんにちは！これはVocera AIの私の声のサンプルです。",
  "zh":  "你好！这是我在Vocera AI上的声音示例。",
  "pt":  "Olá! Este é um exemplo da minha voz no Vocera AI.",
  "ko":  "안녕하세요! 이것은 Vocera AI의 내 목소리 샘플입니다.",
  "it":  "Ciao! Questo è un esempio della mia voce su Vocera AI.",
  "nl":  "Hallo! Dit is een voorbeeld van mijn stem op Vocera AI.",
  "pl":  "Cześć! To jest przykład mojego głosu w Vocera AI.",
  "ru":  "Привет! Это образец моего голоса от Vocera AI.",
  "tr":  "Merhaba! Bu Vocera AI'dan sesimin bir örneği.",
  "uk":  "Привіт! Це зразок мого голосу від Vocera AI.",
  "sv":  "Hej! Det här är ett exempel på min röst från Vocera AI.",
  "nb":  "Hei! Dette er et eksempel på stemmen min fra Vocera AI.",
  "da":  "Hej! Dette er et eksempel på min stemme fra Vocera AI.",
  "fi":  "Hei! Tämä on näyte äänestäni Vocera AI:lta.",
  "id":  "Halo! Ini adalah contoh suara saya dari Vocera AI.",
  "ms":  "Helo! Ini adalah sampel suara saya dari Vocera AI.",
  "th":  "สวัสดี! นี่คือตัวอย่างเสียงของฉันจาก Vocera AI.",
  "vi":  "Xin chào! Đây là mẫu giọng nói của tôi từ Vocera AI.",
}

function getSampleText(locale: string | null): string {
  if (!locale) return SAMPLE_TEXT["en"]
  const lang = locale.split("-")[0].toLowerCase()
  return SAMPLE_TEXT[lang] ?? SAMPLE_TEXT["en"]
}

async function generateSample(voiceName: string, text: string): Promise<Buffer> {
  const baseUrl = process.env.EDGE_TTS_BASE_URL
  const apiKey  = process.env.EDGE_TTS_API_KEY

  if (!baseUrl || !apiKey) throw new Error("Edge TTS env vars missing")

  const res = await fetch(`${baseUrl}/v1/audio/speech`, {
    method: "POST",
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
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    throw new Error(`Edge TTS error ${res.status} for voice ${voiceName}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const voices = await prisma.voiceModel.findMany({
    where: {
      provider: "edge",
      isActive: true,
    },
    select: {
      id:           true,
      edgeVoiceName: true,
      edgeLocale:   true,
      slug:         true,
    },
    orderBy: { sortOrder: "asc" },
  })

  console.log(`→ ${voices.length} voices need sample generation\n`)

  let success = 0, failed = 0

  for (const voice of voices) {
    const voiceName = voice.edgeVoiceName
    if (!voiceName) { failed++; continue }

    const text = getSampleText(voice.edgeLocale)

    try {
      process.stdout.write(`  ${voiceName.padEnd(35)} `)

      // Generate audio
      const buffer = await generateSample(voiceName, text)

      // R2 storage key: samples/edge/{voice-slug}.mp3
      const storageKey = `samples/edge/${voice.slug}.mp3`

      // Upload to R2
      await uploadSampleAudio(storageKey, buffer, "audio/mpeg")

      // Public URL তৈরি করো (R2 public bucket URL)
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${storageKey}`

      // DB update
      await prisma.voiceModel.update({
        where: { id: voice.id },
        data:  { sampleAudioUrl: publicUrl },
      })

      console.log(`✓  ${(buffer.length / 1024).toFixed(0)}KB`)
      success++

      // Rate limit — HF Space overload না করতে
      await new Promise(r => setTimeout(r, 300))

    } catch (err) {
      console.log(`✗  ${err instanceof Error ? err.message : err}`)
      failed++
    }
  }

  console.log(`\n─────────────────────────`)
  console.log(`✓ Success: ${success}`)
  console.log(`✗ Failed:  ${failed}`)
  console.log(`─────────────────────────`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())