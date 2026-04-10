"use client"

import { useRef, useState } from "react"
import Link                 from "next/link"

interface HistoryItem {
  id:             string
  inputText:      string
  charCount:      number
  outputFormat:   string
  createdAt:      string
  servedFromCache: boolean
  freshUrl:       string | null
  voiceModel: {
    name:         string
    provider:     string
    edgeVoiceName: string | null
  } | null
  audioFile: {
    fileSizeBytes:   bigint | null
    durationSeconds: number | null
    fileFormat:      string
  } | null
}

const PROVIDER_BADGE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  edge:        { label: "Edge",   color: "#5DCAA5", bg: "rgba(29,158,117,0.12)", border: "rgba(29,158,117,0.25)" },
  google:      { label: "GCP",    color: "#85B7EB", bg: "rgba(55,138,221,0.12)", border: "rgba(55,138,221,0.25)" },
  elevenlabs:  { label: "EL",     color: "#AFA9EC", bg: "rgba(127,119,221,0.12)", border: "rgba(127,119,221,0.25)" },
}

function formatBytes(bytes: bigint | null): string {
  if (!bytes) return "—"
  const n = Number(bytes)
  if (n < 1024)       return `${n} B`
  if (n < 1_048_576)  return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1_048_576).toFixed(1)} MB`
}

function formatDuration(sec: number | null): string {
  if (!sec) return "—"
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, "0")}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffH  = diffMs / 3_600_000
  const diffD  = diffMs / 86_400_000

  if (diffH < 1)   return "Just now"
  if (diffH < 24)  return `${Math.floor(diffH)}h ago`
  if (diffD < 7)   return `${Math.floor(diffD)}d ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface HistoryCardProps {
  item:       HistoryItem
  selected:   boolean
  onSelect:   (id: string) => void
  onDelete:   (id: string) => void
}

export function HistoryCard({
  item, selected, onSelect, onDelete,
}: HistoryCardProps) {
  const audioRef    = useRef<HTMLAudioElement | null>(null)
  const [playing,   setPlaying]   = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [showDel,   setShowDel]   = useState(false)

  const provider = item.voiceModel?.provider ?? "edge"
  const badge    = PROVIDER_BADGE[provider] ?? PROVIDER_BADGE.edge
  const voiceName = (item.voiceModel?.edgeVoiceName ?? item.voiceModel?.name ?? "Unknown")
    .replace(/Neural$/, "")

  function togglePlay(e: React.MouseEvent) {
    e.stopPropagation()
    if (!item.freshUrl) return
    if (playing) {
      audioRef.current?.pause()
      setPlaying(false)
      return
    }
    const audio    = new Audio(item.freshUrl)
    audioRef.current = audio
    audio.play()
    setPlaying(true)
    audio.onended = () => setPlaying(false)
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (deleting) return
    setDeleting(true)
    try {
      await fetch(`/api/history/${item.id}`, { method: "DELETE" })
      onDelete(item.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div
      onMouseEnter={() => setShowDel(true)}
      onMouseLeave={() => setShowDel(false)}
      className={`group relative rounded-xl border bg-[#141424]
                  transition-all duration-200 overflow-hidden cursor-pointer
                  ${selected
                    ? "border-[rgba(120,62,246,0.5)] ring-1 ring-[rgba(120,62,246,0.2)]"
                    : "border-[#282846] hover:border-[rgba(120,62,246,0.25)]"
                  }`}
      onClick={() => onSelect(item.id)}
    >
      {/* Accent top line */}
      <div
        className="absolute top-0 inset-x-0 h-0.5 transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, ${badge.color}, transparent)`,
          opacity: selected ? 1 : 0,
        }}
      />

      {/* Select checkbox */}
      <div
        className={`absolute top-3 left-3 w-5 h-5 rounded-md border
                    flex items-center justify-center transition-all duration-150
                    ${selected
                      ? "bg-[rgb(120,62,246)] border-[rgb(120,62,246)]"
                      : "border-[#282846] bg-[#0F0F1A] opacity-0 group-hover:opacity-100"
                    }`}
        onClick={e => { e.stopPropagation(); onSelect(item.id) }}
      >
        {selected && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none"
               stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1 4l3 3 5-6"/>
          </svg>
        )}
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3 pl-6">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Provider badge */}
            <span
              className="px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0"
              style={{ color: badge.color, background: badge.bg, borderColor: badge.border }}
            >
              {badge.label}
            </span>

            {/* Voice name */}
            <span className="text-[11px] text-white/50 font-medium truncate max-w-30">
              {voiceName}
            </span>

            {/* Cache badge */}
            {item.servedFromCache && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold
                               bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                ⚡
              </span>
            )}
          </div>

          {/* Date */}
          <span className="text-[10px] text-white/25 shrink-0">
            {formatDate(item.createdAt)}
          </span>
        </div>

        {/* Text preview */}
        <p className="text-sm text-white/65 leading-relaxed line-clamp-2 mb-3
                      pl-1 min-h-10">
          {item.inputText}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-2.5 mb-4 flex-wrap">
          {[
            { label: item.audioFile?.fileFormat?.toUpperCase() ?? item.outputFormat.split("_")[0].toUpperCase() },
            { label: formatDuration(item.audioFile?.durationSeconds ?? null) },
            { label: formatBytes(item.audioFile?.fileSizeBytes ?? null) },
            { label: `${item.charCount.toLocaleString()} chars` },
          ].map((m, i) => (
            <span key={i}
                  className="text-[10px] font-mono text-white/30 border border-[#282846]
                             px-1.5 py-0.5 rounded">
              {m.label}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            disabled={!item.freshUrl}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-xs font-medium transition-all duration-150
                       disabled:opacity-30 disabled:cursor-not-allowed
                       ${playing
                         ? "bg-[rgba(120,62,246,0.2)] text-[rgb(167,139,250)]"
                         : "bg-white/6 text-white/45 hover:text-white hover:bg-white/10"
                       }`}
          >
            {playing ? (
              <>
                {/* Pause icon */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="1" y="0" width="3.5" height="10" rx="1"/>
                  <rect x="5.5" y="0" width="3.5" height="10" rx="1"/>
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M1 0.5L9.5 5L1 9.5V0.5Z"/>
                </svg>
                Play
              </>
            )}
          </button>

          {/* Download */}
          {item.freshUrl && (
            <a
              href={item.freshUrl}
              download={`vocera-${item.id}.${item.audioFile?.fileFormat ?? "mp3"}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         text-xs text-white/40 hover:text-white
                         bg-white/6 hover:bg-white/10
                         transition-all duration-150"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M5 1v5M2.5 4l2.5 2.5L7.5 4"/><path d="M1 8.5h8"/>
              </svg>
              Download
            </a>
          )}

          <div className="flex-1"/>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className={`p-1.5 rounded-lg transition-all duration-150
                       ${(showDel || selected)
                         ? "opacity-100"
                         : "opacity-0"
                       }
                       text-white/20 hover:text-red-400 hover:bg-red-500/10
                       disabled:opacity-50`}
            aria-label="Delete"
          >
            {deleting ? (
              <span className="w-3.5 h-3.5 block border border-white/20
                               border-t-white/60 rounded-full animate-spin"/>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 5.5v5M9 5.5v5M3.5 3.5l.5 8h6l.5-8"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}