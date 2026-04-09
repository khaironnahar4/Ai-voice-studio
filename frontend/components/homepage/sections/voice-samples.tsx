"use client"

import { useEffect, useRef, useState } from "react"
import { useGSAP }                      from "@gsap/react"
import gsap                             from "gsap"
import { ScrollTrigger }                from "gsap/ScrollTrigger"
import Link from "next/link"

gsap.registerPlugin(ScrollTrigger)

// ── Types ─────────────────────────────────────────────────────────────────
interface FeaturedVoice {
  id:           string
  voiceName:    string
  friendlyName: string
  locale:       string | null
  gender:       string | null
  styleTags:    string[]
  isPremium:    boolean
    sampleAudioUrl: string | null
  language: {
    code:       string | null
    name:       string | null
    nativeName: string | null
  }
}

// ── Language flag emoji (locale → flag) ───────────────────────────────────
const LOCALE_FLAG: Record<string, string> = {
  "en-US": "🇺🇸", "en-GB": "🇬🇧", "bn-BD": "🇧🇩",
  "bn-IN": "🇮🇳", "hi-IN": "🇮🇳", "ar-SA": "🇸🇦",
  "fr-FR": "🇫🇷", "es-ES": "🇪🇸", "de-DE": "🇩🇪",
  "ja-JP": "🇯🇵", "zh-CN": "🇨🇳", "pt-BR": "🇧🇷",
}

function getFlag(locale: string | null): string {
  if (!locale) return "🌐"
  return LOCALE_FLAG[locale] ?? "🌐"
}

// ── Animated waveform bars ─────────────────────────────────────────────────
function WaveformBars({ playing }: { playing: boolean }) {
  const bars = Array.from({ length: 5 })
  return (
    <div className="flex items-center gap-0.75 h-4">
      {bars.map((_, i) => (
        <span
          key={i}
          className={`w-0.75 rounded-full transition-all duration-300
            ${playing
              ? "bg-[rgb(var(--accent))]"
              : "bg-white/20"
            }`}
          style={{
            height:                  playing ? `${8 + (i % 3) * 4}px` : "4px",
            animationName:           playing ? "wave" : "none",
            animationDuration:       `${0.6 + i * 0.1}s`,
            animationDelay:          `${i * 0.08}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
          }}
        />
      ))}
    </div>
  )
}

// ── Single voice card ──────────────────────────────────────────────────────
function VoiceCard({
  voice,
  isPlaying,
  isLoading,
  onPlay,
}: {
  voice:     FeaturedVoice
  isPlaying: boolean
  isLoading: boolean
  onPlay:    (voice: FeaturedVoice) => void
}) {
  const flag         = getFlag(voice.locale)
  const genderLabel  = voice.gender === "Female" ? "F"
                     : voice.gender === "Male"   ? "M" : "N"
  const genderColor  = voice.gender === "Female"
    ? "bg-pink-500/15 text-pink-300 border-pink-500/20"
    : voice.gender === "Male"
    ? "bg-blue-500/15 text-blue-300 border-blue-500/20"
    : "bg-white/10 text-white/50 border-white/10"

  return (
    <div
      className={`reveal-item group relative rounded-xl border
        transition-all duration-200 cursor-pointer overflow-hidden
        ${isPlaying
          ? "border-[rgb(var(--accent)/0.5)] bg-[rgb(var(--surface-2))]"
          : "border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] hover:border-[rgb(var(--accent)/0.3)]"
        }`}
      onClick={() => onPlay(voice)}
    >
      {/* Top accent line — visible when playing */}
      <div
        className={`absolute top-0 inset-x-0 h-0.5 bg-linear-to-r
          from-[rgb(var(--accent))] to-[rgb(var(--cyan))]
          transition-opacity duration-300
          ${isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`}
      />

      <div className="p-4 md:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            {/* Flag */}
            <span className="text-xl shrink-0 leading-none">{flag}</span>

            {/* Name */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/90 truncate leading-tight">
                {/* "Microsoft Aria Online (Natural) - English..." → short name */}
                {voice.voiceName?.replace(/Neural$/, "") ?? "Voice"}
              </p>
              <p className="text-[11px] text-white/35 truncate mt-0.5">
                {voice.language.name ?? voice.locale}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {voice.isPremium && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold
                               bg-amber-500/15 text-amber-400 border border-amber-500/20">
                PRO
              </span>
            )}
            <span className={`w-5 h-5 rounded-full flex items-center justify-center
                             text-[10px] font-bold border ${genderColor}`}>
              {genderLabel}
            </span>
          </div>
        </div>

        {/* Style tags */}
        {voice.styleTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {voice.styleTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px]
                           bg-white/5 text-white/35 border border-white/8
                           capitalize"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Play button row */}
        <div className="flex items-center justify-between">
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(voice) }}
            disabled={isLoading}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
              text-xs font-medium transition-all duration-150
              ${isPlaying
                ? "bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent-light))]"
                : "bg-white/8 text-white/50 hover:text-white hover:bg-white/12"
              }
              ${isLoading ? "opacity-50 cursor-wait" : ""}
            `}
            aria-label={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isLoading ? (
              <>
                <span className="w-3 h-3 border border-white/30 border-t-white/80
                                 rounded-full animate-spin" />
                Loading…
              </>
            ) : isPlaying ? (
              <>
                <WaveformBars playing />
                Pause
              </>
            ) : (
              <>
                {/* Play icon */}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M2 1.5L10 6L2 10.5V1.5Z" />
                </svg>
                Preview
              </>
            )}
          </button>

          <WaveformBars playing={isPlaying} />
        </div>
      </div>
    </div>
  )
}

// ── Skeleton card ─────────────────────────────────────────────────────────
function VoiceCardSkeleton() {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))]
                    bg-[rgb(var(--surface-2))] p-4 md:p-5">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-7 h-7 rounded-full skeleton shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-28 rounded skeleton" />
          <div className="h-2.5 w-20 rounded skeleton" />
        </div>
      </div>
      <div className="flex gap-1 mb-4">
        <div className="h-4 w-14 rounded-full skeleton" />
        <div className="h-4 w-16 rounded-full skeleton" />
      </div>
      <div className="h-7 w-20 rounded-lg skeleton" />
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────
export default function VoiceSamples() {
  const container  = useRef<HTMLDivElement>(null)
  const audioRef   = useRef<HTMLAudioElement | null>(null)

  const [voices,    setVoices]    = useState<FeaturedVoice[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter,    setFilter]    = useState<"all" | "female" | "male">("all")

  // ── Fetch featured voices ───────────────────────────────────────────
  useEffect(() => {
    fetch("/api/voices/featured")
      .then((r) => r.json())
      .then((data) => {
        setVoices(data.voices ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError("Could not load voices.")
        setLoading(false)
      })
  }, [])

  // console.log("Featured voices:", voices)   // Debug log
  // ── GSAP scroll reveal ──────────────────────────────────────────────
  // useGSAP(() => {
  //   const mm = gsap.matchMedia()
  //   mm.add("(prefers-reduced-motion: no-preference)", () => {
  //     gsap.from(".voices-heading", {
  //       y:       40,
  //       opacity: 0,
  //       duration: 0.9,
  //       ease:    "power3.out",
  //       scrollTrigger: {
  //         trigger: container.current,
  //         start:   "top 80%",
  //       },
  //     })
  //     gsap.from(".reveal-item", {
  //       y:        30,
  //       opacity:  0,
  //       duration: 0.7,
  //       stagger:  0.08,
  //       ease:     "power3.out",
  //       scrollTrigger: {
  //         trigger: container.current,
  //         start:   "top 70%",
  //       },
  //     })
  //   })
  // }, { scope: container, dependencies: [voices] })

  // ── Play / pause logic ──────────────────────────────────────────────
 async function handlePlay(voice: FeaturedVoice) {
  // Already playing → pause
  if (playingId === voice.id) {
    audioRef.current?.pause()
    setPlayingId(null)
    return
  }

  // Stop current
  if (audioRef.current) {
    audioRef.current.pause()
    audioRef.current = null
  }
  setPlayingId(null)

  // sampleAudioUrl আছে? → সরাসরি play করো, কোনো API call নেই
  if (voice.sampleAudioUrl) {
    const audio    = new Audio(voice.sampleAudioUrl)
    audioRef.current = audio
    audio.play()
    setPlayingId(voice.id)
    audio.onended = () => setPlayingId(null)
    return
  }

  // Fallback — sample নেই হলে live generate করো (edge case)
  setLoadingId(voice.id)
  // try {
  //   const res = await fetch("/api/voices/preview", {
  //     method:  "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body:    JSON.stringify({ voiceName: voice.voiceName }),
  //   })
  //   if (!res.ok) { setLoadingId(null); return }
  //   const blob  = await res.blob()
  //   const url   = URL.createObjectURL(blob)
  //   const audio = new Audio(url)
  //   audioRef.current = audio
  //   audio.play()
  //   setPlayingId(voice.id)
  //   setLoadingId(null)
  //   audio.onended = () => { setPlayingId(null); URL.revokeObjectURL(url) }
  // } catch { setLoadingId(null) }
}


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  // ── Filter ──────────────────────────────────────────────────────────
  const filtered = voices.filter((v) => {
    if (filter === "all")    return true
    if (filter === "female") return v.gender?.toLowerCase() === "female"
    if (filter === "male")   return v.gender?.toLowerCase() === "male"
    return true
  })

  return (
    <section
      ref={container}
      className="py-20 md:py-28 px-4"
      id="voices"
    >
      <div className="max-w-6xl mx-auto">

        {/* Section heading */}
        <div className="voices-heading text-center mb-12 md:mb-16">
          <p className="text-xs font-mono tracking-widest text-[rgb(var(--accent-light))]
                        uppercase mb-4">
            200+ voices · 30+ languages
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight
                         text-white leading-tight">
            Every voice sounds
            <span className="block bg-linear-to-r from-[rgb(var(--accent-light))]
                             to-[rgb(var(--cyan))] bg-clip-text text-transparent">
              completely human.
            </span>
          </h2>
          <p className="text-white/45 mt-4 max-w-xl mx-auto text-sm md:text-base
                        leading-relaxed">
            Click any voice to hear a live preview — generated in real time
            using Edge TTS neural models.
          </p>

          {/* Filter pills */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {(["all", "female", "male"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium
                  transition-all duration-150 capitalize border
                  ${filter === f
                    ? "bg-[rgb(var(--accent)/0.2)] text-[rgb(var(--accent-light))] border-[rgb(var(--accent)/0.3)]"
                    : "text-white/40 border-transparent hover:text-white/60"
                  }`}
              >
                {f === "all" ? "All voices" : `${f} voices`}
              </button>
            ))}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <p className="text-center text-sm text-red-400/70 py-12">{error}</p>
        )}

        {/* Voice grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
                        gap-3 md:gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <VoiceCardSkeleton key={i} />
              ))
            : filtered.map((voice) => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  isPlaying={playingId === voice.id}
                  isLoading={loadingId === voice.id}
                  onPlay={handlePlay}
                />
              ))
          }
        </div>

        {/* CTA under voices */}
        <div className="text-center mt-12">
          <p className="text-sm text-white/30 mb-4">
            Want to use your own text? Sign up — it&apos;s free.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                       bg-[rgb(var(--accent))] hover:bg-[rgb(var(--accent)/0.9)]
                       text-white text-sm font-medium
                       transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start for free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 1L13 7L7 13M13 7H1" stroke="currentColor"
                    strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </Link>
        </div>
          </div>
    </section>
  )
}