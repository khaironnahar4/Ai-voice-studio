"use client"

import Link                 from "next/link"
import { useState, useRef } from "react"

interface Generation {
  id:           string
  inputText:    string
  charCount:    number
  createdAt:    string
  voiceModel: {
    name:         string
    provider:     string
    edgeVoiceName: string | null
  } | null
  audioFile: {
    signedUrl:       string | null
    durationSeconds: number | null
    fileFormat:      string
  } | null
}

const PROVIDER_COLOR: Record<string, string> = {
  edge:       "text-teal-400",
  google:     "text-blue-400",
  elevenlabs: "text-violet-400",
}

const PROVIDER_BG: Record<string, string> = {
  edge:       "bg-teal-500/10 border-teal-500/20",
  google:     "bg-blue-500/10 border-blue-500/20",
  elevenlabs: "bg-violet-500/10 border-violet-500/20",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h    = Math.floor(diff / 3_600_000)
  const d    = Math.floor(diff / 86_400_000)
  if (diff < 60_000)  return "just now"
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (h < 24) return `${h}h ago`
  if (d < 7)  return `${d}d ago`
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function RecentList({ items }: { items: Generation[] }) {
  const [playingId, setPlayingId] = useState<string | null>(null)
  const audioRef   = useRef<HTMLAudioElement | null>(null)

  function togglePlay(item: Generation, e: React.MouseEvent) {
    e.preventDefault()
    const url = item.audioFile?.signedUrl
    if (!url) return

    if (playingId === item.id) {
      audioRef.current?.pause()
      setPlayingId(null)
      return
    }
    audioRef.current?.pause()
    const audio = new Audio(url)
    audioRef.current = audio
    audio.play()
    setPlayingId(item.id)
    audio.onended = () => setPlayingId(null)
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-white/30">No generations yet.</p>
        <Link
          href="/studio"
          className="mt-3 text-xs text-[rgb(167,139,250)]
                     hover:text-[rgb(120,62,246)] transition-colors underline
                     underline-offset-2"
        >
          Create your first audio →
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#282846]/60">
      {items.map(item => {
        const provider  = item.voiceModel?.provider ?? "edge"
        const voiceName = (item.voiceModel?.edgeVoiceName
          ?? item.voiceModel?.name
          ?? "Unknown"
        ).replace(/Neural$/, "")
        const isPlaying = playingId === item.id

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 py-3 group"
          >
            {/* Play button */}
            <button
              onClick={e => togglePlay(item, e)}
              disabled={!item.audioFile?.signedUrl}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center
                         justify-center transition-all duration-150
                         disabled:opacity-30 disabled:cursor-not-allowed
                         ${isPlaying
                           ? "bg-[rgba(120,62,246,0.25)] text-[rgb(167,139,250)]"
                           : "bg-white/6 text-white/35 hover:text-white hover:bg-white/10"
                         }`}
            >
              {isPlaying ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="1" y="0" width="3" height="10" rx="1"/>
                  <rect x="6" y="0" width="3" height="10" rx="1"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M1 0.5L9.5 5L1 9.5V0.5Z"/>
                </svg>
              )}
            </button>

            {/* Text preview */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/70 truncate leading-snug">
                {item.inputText}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded
                             border ${PROVIDER_BG[provider]} ${PROVIDER_COLOR[provider]}`}
                >
                  {voiceName}
                </span>
                <span className="text-[10px] text-white/25 font-mono">
                  {item.charCount.toLocaleString()} chars
                </span>
              </div>
            </div>

            {/* Time */}
            <span className="text-[11px] text-white/25 shrink-0 tabular-nums">
              {timeAgo(item.createdAt)}
            </span>
          </div>
        )
      })}
    </div>
  )
}