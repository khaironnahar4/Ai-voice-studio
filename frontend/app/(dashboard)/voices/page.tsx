
"use client"

import {
  useCallback, useEffect,
  useRef,      useState,
}                        from "react"
import Link              from "next/link"

// ── Types ──────────────────────────────────────────────────────────────
interface Voice {
  id:               string
  name:             string
  provider:         string
  gender:           string | null
  isPremium:        boolean
  styleTags:        string[]
  sampleAudioUrl:   string | null
  edgeVoiceName:    string | null
  edgeFriendlyName: string | null
  edgeLocale:       string | null
  edgeGender:       string | null
  language: {
    code:       string
    name:       string
    nativeName: string | null
  }
}

interface ApiResponse {
  voices:    Voice[]
  total:     number
  page:      number
  pages:     number
  hasMore:   boolean
  languages: { code: string; name: string }[]
}

// ── Constants ──────────────────────────────────────────────────────────
const PROVIDER_META: Record<string, {
  label: string; color: string; bg: string; border: string
}> = {
  edge: {
    label:  "Edge",
    color:  "rgb(93,202,165)",
    bg:     "rgba(29,158,117,0.12)",
    border: "rgba(29,158,117,0.25)",
  },
  google: {
    label:  "GCP",
    color:  "rgb(133,183,235)",
    bg:     "rgba(55,138,221,0.12)",
    border: "rgba(55,138,221,0.25)",
  },
  elevenlabs: {
    label:  "EL",
    color:  "rgb(175,169,236)",
    bg:     "rgba(127,119,221,0.12)",
    border: "rgba(127,119,221,0.25)",
  },
}

const LOCALE_FLAG: Record<string, string> = {
  "en-US":"🇺🇸","en-GB":"🇬🇧","en-AU":"🇦🇺","en-IN":"🇮🇳",
  "bn-BD":"🇧🇩","bn-IN":"🇮🇳","hi-IN":"🇮🇳","ar-SA":"🇸🇦",
  "fr-FR":"🇫🇷","fr-BE":"🇧🇪","fr-CA":"🇨🇦",
  "es-ES":"🇪🇸","es-MX":"🇲🇽","de-DE":"🇩🇪","de-AT":"🇦🇹",
  "ja-JP":"🇯🇵","zh-CN":"🇨🇳","zh-TW":"🇹🇼","pt-BR":"🇧🇷",
  "ko-KR":"🇰🇷","it-IT":"🇮🇹","nl-NL":"🇳🇱","pl-PL":"🇵🇱",
  "ru-RU":"🇷🇺","tr-TR":"🇹🇷","vi-VN":"🇻🇳","th-TH":"🇹🇭",
  "id-ID":"🇮🇩","ms-MY":"🇲🇾","uk-UA":"🇺🇦","sv-SE":"🇸🇪",
  "nb-NO":"🇳🇴","da-DK":"🇩🇰","fi-FI":"🇫🇮",
}

function getFlag(locale: string | null) {
  if (!locale) return "🌐"
  return LOCALE_FLAG[locale] ?? "🌐"
}

function displayName(v: Voice) {
  return (v.edgeFriendlyName ?? v.edgeVoiceName ?? v.name)
    .replace(/Neural$/, "")
    .trim()
}

// ── Waveform animation ─────────────────────────────────────────────────
function Waveform({ playing }: { playing: boolean }) {
  const heights = [5, 9, 14, 11, 16, 9, 6, 12, 15, 8]
  return (
    <div className="flex items-center gap-[2px] h-4">
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[2px] rounded-full bg-gradient-to-t
                     from-[rgb(120,62,246)] to-[rgb(34,211,238)]"
          style={{
            height:                  playing ? `${h}px` : "3px",
            animationName:           playing ? "waveBar" : "none",
            animationDuration:       `${0.6 + i * 0.07}s`,
            animationDelay:          `${i * 0.04}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            transition:              "height 0.25s ease",
          }}
        />
      ))}
    </div>
  )
}

// ── Voice card ─────────────────────────────────────────────────────────
function VoiceCard({
  voice,
  isPlaying,
  isLoading,
  onPlay,
}: {
  voice:     Voice
  isPlaying: boolean
  isLoading: boolean
  onPlay:    (v: Voice) => void
}) {
  const p      = PROVIDER_META[voice.provider] ?? PROVIDER_META.edge
  const flag   = getFlag(voice.edgeLocale)
  const name   = displayName(voice)
  const gender = (voice.edgeGender ?? voice.gender ?? "").toLowerCase()
  const tags   = voice.styleTags.slice(0, 2)

  return (
    <div
      className={`group relative rounded-2xl border bg-[#141424]
                  transition-all duration-200 overflow-hidden
                  hover:-translate-y-[2px] hover:border-[rgba(120,62,246,0.3)]
                  hover:shadow-[0_8px_30px_rgba(120,62,246,0.1)]
                  ${isPlaying
                    ? "border-[rgba(120,62,246,0.45)] shadow-[0_8px_30px_rgba(120,62,246,0.12)]"
                    : "border-[#282846]"
                  }`}
    >
      {/* Playing accent bar */}
      {isPlaying && (
        <div className="absolute top-0 inset-x-0 h-[2px]
                        bg-gradient-to-r from-[rgb(120,62,246)]
                        to-[rgb(34,211,238)]"/>
      )}

      <div className="p-4">
        {/* Top row — flag + badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl text-lg flex items-center
                            justify-center border flex-shrink-0
                            transition-all duration-200
                            ${isPlaying
                              ? "border-[rgba(120,62,246,0.4)] bg-[rgba(120,62,246,0.15)]"
                              : "border-[#282846] bg-[#0F0F1A]"
                            }`}>
              {flag}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate leading-snug
                            transition-colors
                            ${isPlaying ? "text-white" : "text-white/80"}`}>
                {name}
              </p>
              <p className="text-[11px] text-white/30 mt-0.5 truncate">
                {voice.language.name}
                {gender && (
                  <span className={`ml-1.5
                    ${gender === "female" ? "text-pink-400" : "text-blue-400"}`}>
                    {gender === "female" ? "♀" : "♂"}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Premium badge */}
          {voice.isPremium && (
            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[9px]
                           font-bold bg-amber-500/15 text-amber-400
                           border border-amber-500/20">
              PRO
            </span>
          )}
        </div>

        {/* Style tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map(tag => (
              <span key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px]
                               text-white/35 border border-[#282846]
                               bg-[#0F0F1A] capitalize">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom — provider + play */}
        <div className="flex items-center justify-between mt-1">
          {/* Provider badge */}
          <span
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
            style={{
              color:       p.color,
              background:  p.bg,
              borderColor: p.border,
            }}
          >
            {p.label}
          </span>

          {/* Play button */}
          <button
            onClick={() => onPlay(voice)}
            disabled={!voice.sampleAudioUrl || isLoading}
            aria-label={isPlaying ? "Pause" : `Play ${name}`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg
                       text-xs font-medium transition-all duration-150
                       disabled:opacity-40 disabled:cursor-not-allowed
                       ${isPlaying
                         ? "bg-[rgba(120,62,246,0.25)] text-[rgb(167,139,250)]"
                         : "bg-white/6 text-white/50 hover:text-white hover:bg-white/10"
                       }`}
          >
            {isLoading ? (
              <span className="w-3 h-3 border border-white/25
                               border-t-white/70 rounded-full animate-spin"/>
            ) : isPlaying ? (
              <Waveform playing />
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10"
                   fill="currentColor">
                <path d="M1 0.5L9.5 5L1 9.5V0.5Z"/>
              </svg>
            )}
            {isLoading ? "Loading…" : isPlaying ? "Playing" : "Play"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton card ──────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-[#282846] bg-[#141424] p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-9 h-9 rounded-xl skeleton shrink-0"/>
        <div className="space-y-1.5 flex-1">
          <div className="h-3.5 w-24 rounded skeleton"/>
          <div className="h-3 w-16 rounded skeleton"/>
        </div>
      </div>
      <div className="flex gap-1.5 mb-3">
        <div className="h-4 w-14 rounded-full skeleton"/>
        <div className="h-4 w-16 rounded-full skeleton"/>
      </div>
      <div className="flex justify-between">
        <div className="h-5 w-10 rounded skeleton"/>
        <div className="h-7 w-16 rounded-lg skeleton"/>
      </div>
    </div>
  )
}

// ── Filter pill ────────────────────────────────────────────────────────
function FilterPill({
  active, onClick, children,
}: {
  active:   boolean
  onClick:  () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium
                 border transition-all duration-150 whitespace-nowrap
                 ${active
                   ? "bg-[rgba(120,62,246,0.2)] text-[rgb(167,139,250)] border-[rgba(120,62,246,0.35)]"
                   : "text-white/40 border-[#282846] hover:text-white/70 hover:border-white/20"
                 }`}
    >
      {children}
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────
export default function VoicesPage() {
  const [voices,    setVoices]    = useState<Voice[]>([])
  const [languages, setLanguages] = useState<{code:string;name:string}[]>([])
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [hasMore,   setHasMore]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filters
  const [search,   setSearch]   = useState("")
  const [lang,     setLang]     = useState("all")
  const [gender,   setGender]   = useState("all")
  const [provider, setProvider] = useState("all")

  // Audio
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("")
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350)
    return () => clearTimeout(t)
  }, [search])

  // Fetch
  const fetchVoices = useCallback(async (
    pg: number, replace: boolean
  ) => {
    if (replace) setLoading(true)
    else         setLoadingMore(true)

    const params = new URLSearchParams({
      q:        debouncedSearch,
      lang,
      gender,
      provider,
      page:     String(pg),
    })

    try {
      const res  = await fetch(`/api/voices?${params}`)
      const data = await res.json() as ApiResponse

      setVoices(prev => replace ? data.voices : [...prev, ...data.voices])
      setTotal(data.total)
      setPage(data.page)
      setHasMore(data.hasMore)
      if (data.languages.length > 0) setLanguages(data.languages)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [debouncedSearch, lang, gender, provider])

  // Refetch on filter change
  useEffect(() => {
    setPage(1)
    fetchVoices(1, true)
  }, [fetchVoices])

  // Play / pause
  async function handlePlay(voice: Voice) {
    // Pause current
    if (playingId === voice.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    audioRef.current?.pause()
    setPlayingId(null)

    if (!voice.sampleAudioUrl) return

    setLoadingId(voice.id)
    try {
      const audio      = new Audio(voice.sampleAudioUrl)
      audioRef.current = audio
      await audio.play()
      setPlayingId(voice.id)
      setLoadingId(null)
      audio.onended = () => setPlayingId(null)
    } catch {
      setLoadingId(null)
    }
  }

  // Cleanup
  useEffect(() => () => { audioRef.current?.pause() }, [])

  const hasFilters = debouncedSearch || lang !== "all" ||
                     gender !== "all" || provider !== "all"

  const GENDER_OPTS    = [["all","All"],["female","Female"],["male","Male"]]
  const PROVIDER_OPTS  = [
    ["all","All providers"],
    ["edge","Edge TTS"],
    ["google","Google Cloud"],
    ["elevenlabs","ElevenLabs"],
  ]

  return (
    <div className="min-h-screen bg-[#0F0F1A]">
      {/* ── Hero header ───────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[#282846]">
        {/* Grid bg */}
        <div className="absolute inset-0 opacity-[0.025]"
             style={{
               backgroundImage:
                 "linear-gradient(rgba(120,62,246,1) 1px, transparent 1px)," +
                 "linear-gradient(90deg, rgba(120,62,246,1) 1px, transparent 1px)",
               backgroundSize: "48px 48px",
             }}/>
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2
                        w-[600px] h-[200px] rounded-full
                        bg-[rgba(120,62,246,0.07)] blur-[80px]
                        pointer-events-none"/>

        <div className="relative max-w-[1200px] mx-auto px-5
                        pt-20 pb-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5
                         rounded-full border border-[rgba(120,62,246,0.3)]
                         bg-[rgba(120,62,246,0.1)] mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[rgb(34,211,238)]
                             animate-pulse"/>
            <span className="text-[12px] text-[rgb(167,139,250)] font-medium">
              {total > 0
                ? `${total.toLocaleString()} voices available`
                : "Loading voices…"
              }
            </span>
          </div>

          <h1 className="text-[clamp(30px,5vw,60px)] font-bold
                         tracking-[-0.04em] leading-[0.97] mb-4">
            Explore all
            <span className="bg-gradient-to-r from-[rgb(167,139,250)]
                             to-[rgb(34,211,238)] bg-clip-text
                             text-transparent">
              {" "}voices
            </span>
          </h1>
          <p className="text-[15px] text-white/40 max-w-md mx-auto
                        leading-relaxed mb-8">
            200+ neural voices across 30+ languages. Click any card
            to preview — each sample is pre-generated for instant playback.
          </p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2
                           w-4 h-4 text-white/25 pointer-events-none"
                 viewBox="0 0 16 16" fill="none"
                 stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="4.5"/>
              <path d="M11 11l3 3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by voice name or language…"
              className="w-full bg-[#141424] border border-[#282846]
                         rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white
                         placeholder:text-white/20 focus:outline-none
                         focus:border-[rgba(120,62,246,0.5)]
                         transition-colors duration-150"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           text-white/25 hover:text-white/60 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                     stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M3 3l8 8M11 3l-8 8"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-[rgba(15,15,26,0.9)]
                      backdrop-blur-xl border-b border-[#282846]">
        <div className="max-w-[1200px] mx-auto px-5 py-3">
          <div className="flex items-center gap-2 overflow-x-auto
                          scrollbar-none flex-nowrap">

            {/* Gender */}
            <div className="flex items-center gap-1.5 shrink-0">
              {GENDER_OPTS.map(([v, l]) => (
                <FilterPill
                  key={v}
                  active={gender === v}
                  onClick={() => setGender(v)}
                >
                  {l}
                </FilterPill>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-[#282846] mx-1 shrink-0"/>

            {/* Provider */}
            <div className="flex items-center gap-1.5 shrink-0">
              {PROVIDER_OPTS.map(([v, l]) => (
                <FilterPill
                  key={v}
                  active={provider === v}
                  onClick={() => setProvider(v)}
                >
                  {l}
                </FilterPill>
              ))}
            </div>

            {/* Divider */}
            {languages.length > 0 && (
              <div className="w-px h-4 bg-[#282846] mx-1 shrink-0"/>
            )}

            {/* Language pills — top 10 */}
            <div className="flex items-center gap-1.5 min-w-0">
              <FilterPill
                active={lang === "all"}
                onClick={() => setLang("all")}
              >
                All languages
              </FilterPill>
              {languages.slice(0, 10).map(l => (
                <FilterPill
                  key={l.code}
                  active={lang === l.code}
                  onClick={() => setLang(lang === l.code ? "all" : l.code)}
                >
                  {l.name}
                </FilterPill>
              ))}
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <>
                <div className="w-px h-4 bg-[#282846] mx-1 shrink-0"/>
                <button
                  onClick={() => {
                    setSearch(""); setLang("all")
                    setGender("all"); setProvider("all")
                  }}
                  className="text-[11px] text-white/30 hover:text-white/60
                             transition-colors shrink-0 underline
                             underline-offset-2"
                >
                  Clear all
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Voice grid ────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-5 py-8">

        {/* Results count */}
        {!loading && (
          <p className="text-xs text-white/30 mb-5">
            {total > 0
              ? `Showing ${voices.length} of ${total.toLocaleString()} voices`
              : "No voices match your filters."
            }
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2
                          md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : voices.length === 0 ? (
          <div className="flex flex-col items-center justify-center
                          py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#141424]
                           border border-[#282846] flex items-center
                           justify-center mb-4 text-2xl">
              🔍
            </div>
            <p className="text-sm text-white/40 font-medium mb-1">
              No voices found
            </p>
            <p className="text-xs text-white/25">
              Try a different search term or clear your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2
                            md:grid-cols-3 lg:grid-cols-4 gap-3">
              {voices.map(voice => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  isPlaying={playingId === voice.id}
                  isLoading={loadingId === voice.id}
                  onPlay={handlePlay}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => fetchVoices(page + 1, false)}
                  disabled={loadingMore}
                  className="flex items-center gap-2.5 px-7 py-3 rounded-2xl
                             border border-[#282846] text-sm text-white/50
                             hover:text-white hover:border-white/20
                             transition-all duration-150 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <span className="w-4 h-4 border border-white/20
                                       border-t-white/60 rounded-full
                                       animate-spin"/>
                      Loading…
                    </>
                  ) : (
                    <>
                      Load more voices
                      <span className="text-white/25 text-xs">
                        ({total - voices.length} remaining)
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── CTA footer ────────────────────────────────────────── */}
      <div className="border-t border-[#282846] bg-[rgba(120,62,246,0.03)]">
        <div className="max-w-[700px] mx-auto px-5 py-16 text-center">
          <h2 className="text-[clamp(22px,3vw,36px)] font-bold
                         tracking-tight mb-3">
            Ready to generate?
          </h2>
          <p className="text-sm text-white/40 mb-7 leading-relaxed">
            Start with any voice for free. 10,000 characters/month
            on the Free plan.
          </p>
          {/* <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/sign-up"
                  className="px-7 py-3 rounded-xl bg-[rgb(120,62,246)]
                             text-white text-sm font-medium
                             hover:bg-[rgba(120,62,246,0.85)]
                             transition-all hover:scale-[1.02]">
              Get started free
            </Link>
            <Link href="/studio"
                  className="px-7 py-3 rounded-xl border border-[#282846]
                             text-white/55 text-sm font-medium
                             hover:text-white hover:border-white/20
                             transition-all">
              Open Studio →
            </Link>
          </div> */}
        </div>
      </div>
    </div>
  )
}