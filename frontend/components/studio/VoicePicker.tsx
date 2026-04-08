"use client"

import { useEffect, useRef, useState } from "react"

interface Voice {
  id:           string
  voiceName:    string
  friendlyName: string
  locale:       string | null
  gender:       string | null
  styleTags:    string[]
  isPremium:    boolean
  language: {
    name:       string | null
    nativeName: string | null
  }
}

const LOCALE_FLAG: Record<string, string> = {
  "en-US":"🇺🇸","en-GB":"🇬🇧","en-AU":"🇦🇺","en-IN":"🇮🇳",
  "bn-BD":"🇧🇩","bn-IN":"🇮🇳","hi-IN":"🇮🇳","ar-SA":"🇸🇦",
  "fr-FR":"🇫🇷","es-ES":"🇪🇸","de-DE":"🇩🇪","ja-JP":"🇯🇵",
  "zh-CN":"🇨🇳","pt-BR":"🇧🇷","ko-KR":"🇰🇷","it-IT":"🇮🇹",
  "nl-NL":"🇳🇱","pl-PL":"🇵🇱","ru-RU":"🇷🇺","tr-TR":"🇹🇷",
}

function getFlag(locale: string | null) {
  if (!locale) return "🌐"
  return LOCALE_FLAG[locale] ?? "🌐"
}

interface VoicePickerProps {
  selectedId: string | null
  onSelect:   (voice: Voice) => void
}

export function VoicePicker({ selectedId, onSelect }: VoicePickerProps) {
  const [voices,  setVoices]  = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState("")
  const [filter,  setFilter]  = useState<"all" | "female" | "male">("all")
  const [playing, setPlaying] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const listRef  = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/voices/featured")
      .then(r => r.json())
      .then(d => { setVoices(d.voices ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handlePreview(voice: Voice, e: React.MouseEvent) {
    e.stopPropagation()
    if (playing === voice.id) {
      audioRef.current?.pause()
      setPlaying(null); return
    }
    audioRef.current?.pause()
    setPreview(voice.id)
    try {
      const res = await fetch("/api/voices/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voiceName: voice.voiceName }),
      })
      if (!res.ok) { setPreview(null); return }
      const blob  = await res.blob()
      const url   = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()
      setPlaying(voice.id); setPreview(null)
      audio.onended = () => { setPlaying(null); URL.revokeObjectURL(url) }
    } catch { setPreview(null) }
  }

  useEffect(() => () => { audioRef.current?.pause() }, [])

  const filtered = voices.filter(v => {
    const q = search.toLowerCase()
    const matchSearch =
      (v.voiceName?.toLowerCase().includes(q)) ||
      (v.language.name?.toLowerCase().includes(q)) ||
      (v.locale?.toLowerCase().includes(q))
    const matchFilter =
      filter === "all" ||
      (filter === "female" && v.gender?.toLowerCase() === "female") ||
      (filter === "male"   && v.gender?.toLowerCase() === "male")
    return matchSearch && matchFilter
  })

  const selected = voices.find(v => v.id === selectedId)

  return (
    <div className="rounded-xl border border-[#282846] bg-[#141424] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#282846]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white/80">Voice</h3>
          {selected && (
            <span className="text-[11px] text-[rgb(var(--accent-light,167,139,250))] font-medium truncate max-w-[140px]">
              {selected.voiceName?.replace(/Neural$/, "")}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-2.5">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25"
               viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="7" cy="7" r="4.5"/><path d="M11 11l3 3" strokeLinecap="round"/>
          </svg>
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search voices or language…"
            className="w-full bg-[#0F0F1A] border border-[#282846] rounded-lg
                       pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/20
                       focus:outline-none focus:border-[rgba(120,62,246,0.5)]
                       transition-colors duration-150"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {(["all","female","male"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium
                         transition-all duration-150 capitalize
                         ${filter === f
                           ? "bg-[rgba(120,62,246,0.2)] text-[rgb(167,139,250)] border border-[rgba(120,62,246,0.3)]"
                           : "text-white/35 hover:text-white/55 border border-transparent"}`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Voice list */}
      <div ref={listRef}
           className="overflow-y-auto flex-1 divide-y divide-[#282846]/60"
           style={{ maxHeight: "320px" }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="w-7 h-7 rounded-full skeleton shrink-0"/>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 rounded skeleton"/>
                <div className="h-2.5 w-16 rounded skeleton"/>
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <p className="text-center text-xs text-white/25 py-8">
            No voices found.
          </p>
        ) : filtered.map(voice => {
          const isSelected = voice.id === selectedId
          const isPlaying_ = playing === voice.id
          const isPrev     = preview === voice.id
          const flag       = getFlag(voice.locale)
          const genderColor = voice.gender?.toLowerCase() === "female"
            ? "text-pink-400" : "text-blue-400"

          return (
            <button key={voice.id} onClick={() => onSelect(voice)}
              className={`w-full flex items-center gap-3 px-4 py-3
                         text-left transition-all duration-100 group
                         ${isSelected
                           ? "bg-[rgba(120,62,246,0.1)]"
                           : "hover:bg-white/[0.03]"}`}>
              {/* Flag avatar */}
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center
                              text-sm border transition-all duration-150
                              ${isSelected
                                ? "border-[rgba(120,62,246,0.4)] bg-[rgba(120,62,246,0.15)]"
                                : "border-[#282846] bg-[#0F0F1A]"}`}>
                {flag}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-xs font-medium truncate
                    ${isSelected ? "text-white" : "text-white/75"}`}>
                    {voice.voiceName?.replace(/Neural$/, "") ?? "Voice"}
                  </span>
                  {voice.isPremium && (
                    <span className="shrink-0 px-1 py-0.5 rounded text-[8px] font-bold
                                     bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/30 truncate">
                  {voice.language.name ?? voice.locale}
                  {voice.gender && (
                    <span className={`ml-1.5 ${genderColor}`}>
                      {voice.gender.toLowerCase() === "female" ? "♀" : "♂"}
                    </span>
                  )}
                </p>
              </div>

              {/* Preview + check */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span onClick={e => handlePreview(voice, e)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center
                             transition-all duration-150 cursor-pointer
                             ${isPlaying_
                               ? "bg-[rgba(34,211,238,0.2)] text-cyan-400"
                               : "text-white/20 hover:text-white/50 hover:bg-white/8"}`}
                  role="button" aria-label="Preview voice">
                  {isPrev ? (
                    <span className="w-2.5 h-2.5 border border-white/30 border-t-white/80
                                     rounded-full animate-spin block"/>
                  ) : isPlaying_ ? (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                      <rect x="0" y="0" width="3" height="8" rx="1"/>
                      <rect x="5" y="0" width="3" height="8" rx="1"/>
                    </svg>
                  ) : (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                      <path d="M1 0.5L7 4L1 7.5V0.5Z"/>
                    </svg>
                  )}
                </span>
                {isSelected && (
                  <svg className="w-3.5 h-3.5 text-[rgb(120,62,246)]"
                       viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 7l4 4 6-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected footer */}
      {selected && (
        <div className="px-4 py-2.5 border-t border-[#282846] bg-[rgba(120,62,246,0.05)]">
          <p className="text-[11px] text-[rgb(167,139,250)]">
            {getFlag(selected.locale)}{" "}
            <span className="font-medium">{selected.voiceName?.replace(/Neural$/, "")}</span>
            {" · "}{selected.language.name}
          </p>
        </div>
      )}
    </div>
  )
}