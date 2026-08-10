import { randomUUID } from "crypto"
import type {
  TtsProvider,
  SynthesisParams,
  SynthesisResult,
} from "./types"

// ── Config ────────────────────────────────────────────────────────────────
function getConfig() {
  const baseUrl = process.env.EDGE_TTS_BASE_URL
  const apiKey  = process.env.EDGE_TTS_API_KEY

  if (!baseUrl) throw new Error("EDGE_TTS_BASE_URL is not set")
  if (!apiKey)  throw new Error("EDGE_TTS_API_KEY is not set")

  return { baseUrl, apiKey }
}

// ── Output format → response_format string ────────────────────────────────
//  MIME_MAP: mp3, opus, aac, flac, wav, pcm
function resolveResponseFormat(outputFormat: string): string {
  const ext = outputFormat.split("_")[0].toLowerCase()

  const supported: Record<string, string> = {
    mp3:  "mp3",
    wav:  "wav",
    ogg:  "opus",   // edge-tts এ ogg = opus
    flac: "mp3",    // edge-tts FLAC support নেই → mp3 fallback
  }

  return supported[ext] ?? "mp3"
}

// ── Main provider class ───────────────────────────────────────────────────
export class EdgeTtsProvider implements TtsProvider {
  async synthesize(params: SynthesisParams): Promise<SynthesisResult> {
    const { baseUrl, apiKey } = getConfig()

    const voiceName = params.voiceModel.edgeVoiceName
    if (!voiceName) {
      throw new Error(
        `Voice model ${params.voiceModel.id} has no edge_voice_name set`
      )
    }

    const responseFormat = resolveResponseFormat(params.outputFormat)

    // ── Request body — OpenAI audio/speech format ─────────────────────
    const body = {
      model:           "tts-1",           // FastAPI তে tts-1 বা tts-1-hd
      input:           params.inputText,
      voice:           voiceName,         // "en-US-AriaNeural"
      response_format: responseFormat,    // "mp3" | "wav" | "opus"
      speed:           params.edgeSpeed ?? 1.0,
    }

    // ── HTTP call to HF Space ─────────────────────────────────────────
    let res: Response
    try {
      res = await fetch(`${baseUrl}/v1/audio/speech`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        // HF Space cold start required time - 60s timeout
        signal: AbortSignal.timeout(90_000),
      })
    } catch (err: unknown) {
      // Timeout বা network error
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Edge TTS request failed: ${msg}`)
    }

    // ── Error handling ────────────────────────────────────────────────
    if (!res.ok) {
      let errText = ""
      try { errText = await res.text() } catch { /* ignore */ }
      throw new Error(
        `Edge TTS API error ${res.status}: ${errText || res.statusText}`
      )
    }

    // ── Audio buffer ──────────────────────────────────────────────────
    const arrayBuffer = await res.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      throw new Error("Edge TTS returned empty audio buffer")
    }

    const providerRequestId = randomUUID()

    const providerCost = params.inputText.length

    return {
      buffer,
      providerRequestId,
      providerCost,
      providerModel: "edge-tts",
      providerVoice: voiceName,          // "en-US-AriaNeural"
    }
  }
}
