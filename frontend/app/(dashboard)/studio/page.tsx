"use client"

import { useRef, useState, useEffect }    from "react"
import { VoicePicker }         from "@/components/studio/VoicePicker"
import { VoiceSettings,
         type VoiceSettingsValue } from "@/components/studio/VoiceSetting"
import { AudioPlayer }         from "@/components/studio/AudioPlayer"
import { useTtsRequest }       from "@/lib/tts/use-tts-request"

const MAX_CHARS = 10_000

interface SelectedVoice {
  id:        string
  voiceName: string
  provider:  string
  locale:    string | null
}

interface GeneratedAudio {
  requestId: string
  url:       string
  format:    string
  fromCache: boolean
}

export default function StudioPage() {
  const [text,          setText]          = useState("")
  const [voice,         setVoice]         = useState<SelectedVoice | null>(null)
  const [settings,      setSettings]      = useState<VoiceSettingsValue>({
    stability:       0.5,
    similarityBoost: 0.75,
    speakingRate:    1.0,
    pitch:           0,
    outputFormat:    "mp3_44100_128",
    languageCode:    "en-US",
  })
  const [submitting,    setSubmitting]    = useState(false)
  const [genProgress,   setGenProgress]  = useState(0)
  const [requestId,     setRequestId]    = useState<string | null>(null)
  const [audio,         setAudio]        = useState<GeneratedAudio | null>(null)
  const [error,         setError]        = useState<string | null>(null)
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const { result, loading: polling } = useTtsRequest(requestId)

  // Sync poll result → audio state
  if (result?.status === "completed" && result.audio?.url && !audio) {
    setAudio({
      requestId: result.requestId,
      url:       result.audio.url,
      format:    settings.outputFormat,
      fromCache: result.fromCache ?? false,
    })
    setRequestId(null)
  }

  const charCount  = text.length
  const overLimit  = charCount > MAX_CHARS
  const charPct    = Math.min((charCount / MAX_CHARS) * 100, 100)
  const isGenerating = submitting || polling
  const canSubmit  = text.trim().length > 0 && voice && !overLimit && !isGenerating

  // Simulate visual progress during generation
  function startProgressAnimation() {
    setGenProgress(0)
    let p = 0
    progressTimer.current = setInterval(() => {
      p += Math.random() * 8
      if (p >= 92) { clearInterval(progressTimer.current!); p = 92 }
      setGenProgress(Math.min(p, 92))
    }, 300)
  }

  function stopProgressAnimation() {
    if (progressTimer.current) clearInterval(progressTimer.current)
    setGenProgress(100)
    setTimeout(() => setGenProgress(0), 600)
  }

  async function handleGenerate() {
    if (!canSubmit || !voice) return
    setSubmitting(true)
    setError(null)
    setAudio(null)
    startProgressAnimation()

    const body: Record<string, unknown> = {
      text,
      voiceModelId: voice.id,
      outputFormat: settings.outputFormat,
      languageCode: settings.languageCode ?? voice.locale ?? "en-US",
    }

    if (voice.provider === "elevenlabs") {
      body.stability       = settings.stability
      body.similarityBoost = settings.similarityBoost
    }
    if (voice.provider === "edge" || voice.provider === "google") {
      body.speakingRate = settings.speakingRate
      body.pitch        = settings.pitch
    }

    try {
      const res  = await fetch("/api/tts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })
      const data = await res.json()
      setSubmitting(false)

      if (!res.ok) {
        stopProgressAnimation()
        setError(data.error ?? "Generation failed. Please try again.")
        return
      }

      // Cache hit — instant
      if (data.status === "completed" && data.url) {
        stopProgressAnimation()
        setAudio({
          requestId: data.requestId,
          url:       data.url,
          format:    settings.outputFormat,
          fromCache: true,
        })
        return
      }

      // Queued — start polling
      setRequestId(data.requestId)
    } catch {
      setSubmitting(false)
      stopProgressAnimation()
      setError("Network error. Check your connection.")
    }
  }

  // When polling completes
  useEffect(() => {
    if (result?.status === "failed" && requestId) {
      setError(result.errorMessage ?? "Generation failed.")
      setRequestId(null)
      stopProgressAnimation()
    }
  }, [result, requestId])

  function handleRegenerate() {
    setAudio(null)
    setError(null)
    handleGenerate()
  }

  // Char counter color
  const counterColor = overLimit
    ? "text-red-400"
    : charPct > 90 ? "text-amber-400"
    : "text-white/25"

  const counterBarColor = overLimit
    ? "bg-red-500"
    : charPct > 90 ? "bg-amber-500"
    : "bg-gradient-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)]"

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Studio</h1>
        <p className="text-white/35 text-sm mt-1">
          Convert your text into natural-sounding speech.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── LEFT: Editor ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Text area card */}
          <div className={`rounded-xl border bg-[#141424] overflow-hidden
                          transition-colors duration-200
                          ${isGenerating
                            ? "border-[rgba(120,62,246,0.4)]"
                            : "border-[#282846] focus-within:border-[rgba(120,62,246,0.35)]"
                          }`}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type or paste your text here…&#10;&#10;Vocera AI will convert it into natural-sounding speech using your selected voice."
              rows={11}
              disabled={isGenerating}
              className="w-full resize-none bg-transparent px-5 pt-5 pb-4
                         text-white/85 placeholder:text-white/20
                         text-sm leading-relaxed focus:outline-none
                         disabled:opacity-60 disabled:cursor-not-allowed"
              maxLength={MAX_CHARS + 200}
            />

            {/* Char counter */}
            <div className="px-5 pb-4 space-y-1.5">
              {/* Progress bar */}
              <div className="h-0.5 bg-[#282846] rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${counterBarColor}`}
                     style={{ width: `${charPct}%` }}/>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/20">
                  {charCount > 0 && `~${Math.ceil(charCount / 5)} words`}
                </span>
                <span className={`text-[11px] font-mono transition-colors ${counterColor}`}>
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl
                            bg-red-500/8 border border-red-500/20">
              <svg className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
                   viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 5zm0 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
              </svg>
              <p className="text-sm text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Audio player — appears after generation */}
          {audio && (
            <AudioPlayer
              url={audio.url}
              format={audio.format}
              requestId={audio.requestId}
              onRegenerate={handleRegenerate}
            />
          )}

          {/* Cache hit badge */}
          {audio?.fromCache && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                            bg-[rgba(34,211,238,0.06)] border border-[rgba(34,211,238,0.15)]
                            w-fit">
              <svg className="w-3 h-3 text-cyan-400" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm2.35 3.65a.75.75 0 0 1 0 1.06L5.56 8.5a.75.75 0 0 1-1.06 0L3.15 7.15a.75.75 0 1 1 1.06-1.06l.82.82 2.26-2.26a.75.75 0 0 1 1.06 0z"/>
              </svg>
              <span className="text-[11px] text-cyan-400 font-medium">
                Served from cache — instant delivery
              </span>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!canSubmit}
            className="relative w-full h-14 rounded-xl font-medium text-sm
                       overflow-hidden transition-all duration-200
                       disabled:cursor-not-allowed"
            style={{
              background: canSubmit
                ? "rgb(120,62,246)"
                : "rgb(26,26,46)",
              color: canSubmit ? "white" : "rgba(255,255,255,0.25)",
            }}
          >
            {/* Progress fill */}
            {isGenerating && genProgress > 0 && (
              <div className="absolute inset-y-0 left-0 rounded-xl
                              bg-linear-to-r from-[rgb(120,62,246)] to-[rgb(99,42,200)]
                              transition-all duration-300"
                   style={{ width: `${genProgress}%` }}/>
            )}

            <span className="relative z-10 flex items-center justify-center gap-2">
              {isGenerating ? (
                <>
                  {/* Inline waveform */}
                  <span className="flex items-center gap-0.75">
                    {[0,1,2,3,4].map(i => (
                      <span key={i} className="w-0.75 rounded-full bg-white/80"
                            style={{
                              height: `${8 + (i % 3) * 4}px`,
                              animation: `wave ${0.6 + i * 0.1}s ease-in-out ${i * 0.08}s infinite`,
                            }}/>
                    ))}
                  </span>
                  Generating…{genProgress > 0 ? ` ${Math.round(genProgress)}%` : ""}
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm3 7.25l-4.5 2.8a.25.25 0 0 1-.5-.25V5.2a.25.25 0 0 1 .5-.25L11 7.75z"/>
                  </svg>
                  Generate speech
                </>
              )}
            </span>
          </button>

          {/* No voice selected hint */}
          {!voice && text.trim().length > 0 && (
            <p className="text-center text-xs text-white/25">
              Select a voice from the panel →
            </p>
          )}
        </div>

        {/* ── RIGHT: Controls ──────────────────────────────────────── */}
        <div className="w-full lg:w-72 xl:w-80 space-y-4 shrink-0">
          <VoicePicker
            selectedId={voice?.id ?? null}
            onSelect={v => {
              setVoice({
                id:        v.id,
                voiceName: v.voiceName,
                provider:  "edge",   // default — adjust if voice has provider field
                locale:    v.locale,
              })
              // Set language code from voice locale
              if (v.locale) {
                setSettings(s => ({ ...s, languageCode: v.locale! }))
              }
            }}
          />
          <VoiceSettings
            value={settings}
            provider={voice?.provider ?? null}
            onChange={setSettings}
          />
        </div>
      </div>
    </div>
  )
}