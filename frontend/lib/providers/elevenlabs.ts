import type { TtsProvider, SynthesisParams, SynthesisResult } from "./types"

const EL_BASE = process.env.EL_BASE 

export class ElevenLabsProvider implements TtsProvider {
  async synthesize(params: SynthesisParams): Promise<SynthesisResult> {
    const elVoiceId = params.voiceModel.elVoiceId
    const elModelId = params.elModelId ?? "eleven_multilingual_v2"

    if (!elVoiceId) {
      throw new Error(
        `Voice model ${params.voiceModel.id} has no el_voice_id set`
      )
    }

    const body = {
      text:       params.inputText,
      model_id:   elModelId,
      language_code: params.languageCode || undefined,
      voice_settings: {
        stability:         params.stability        ?? 0.5,
        similarity_boost:  params.similarityBoost  ?? 0.75,
        style:             params.style            ?? 0,
        use_speaker_boost: params.useSpeakerBoost  ?? true,
      },
      seed:                     params.seed ?? undefined,
      apply_text_normalization: params.applyTextNormalization ?? "auto",
      output_format:            params.outputFormat,
    }

    const res = await fetch(
      `${EL_BASE}/v1/text-to-speech/${elVoiceId}`,
      {
        method:  "POST",
        headers: {
          "xi-api-key":   process.env.ELEVENLABS_API_KEY!,
          "Content-Type": "application/json",
          "Accept":       "audio/*",
        },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`ElevenLabs API error ${res.status}: ${errText}`)
    }

    const providerRequestId = res.headers.get("xi-request-id") ?? randomUUID()
    const charCostHeader    = res.headers.get("character-cost")
    const providerCost      = charCostHeader
      ? parseInt(charCostHeader, 10)
      : params.inputText.length

    const arrayBuffer = await res.arrayBuffer()
    const buffer      = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      throw new Error("ElevenLabs returned zero-length audio buffer")
    }

    return {
      buffer,
      providerRequestId,
      providerCost,
      providerModel: elModelId,
      providerVoice: elVoiceId,
    }
  }
}

function randomUUID(): string {
  return crypto.randomUUID()
}