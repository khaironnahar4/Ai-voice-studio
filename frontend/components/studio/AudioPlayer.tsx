"use client"

import { useEffect, useRef, useState } from "react"

function formatTime(s: number) {
  if (isNaN(s)) return "0:00"
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`
}

interface AudioPlayerProps {
  url:       string
  format:    string
  requestId: string
  onRegenerate?: () => void
}

export function AudioPlayer({ url, format, requestId, onRegenerate }: AudioPlayerProps) {
  const audioRef    = useRef<HTMLAudioElement>(null)
  const [playing,   setPlaying]   = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [current,   setCurrent]   = useState(0)
  const [duration,  setDuration]  = useState(0)
  const [copied,    setCopied]    = useState(false)

  // Auto-play when URL arrives
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !url) return
    audio.src = url
    audio.load()
    audio.play().then(() => setPlaying(true)).catch(() => {})
  }, [url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onMeta  = () => setDuration(audio.duration)
    const onTime  = () => {
      setCurrent(audio.currentTime)
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
    }
    const onEnded = () => setPlaying(false)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("timeupdate",     onTime)
    audio.addEventListener("ended",          onEnded)
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("timeupdate",     onTime)
      audio.removeEventListener("ended",          onEnded)
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else         { audio.play();  setPlaying(true)  }
  }

  function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const r = e.currentTarget.getBoundingClientRect()
    audio.currentTime = ((e.clientX - r.left) / r.width) * duration
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ext = format.split("_")[0].toUpperCase()

  // Animated waveform bars
  const bars = Array.from({ length: 28 })

  return (
    <div className="rounded-xl border border-[rgba(120,62,246,0.25)]
                    bg-[#141424] overflow-hidden
                    animate-in slide-in-from-bottom-4 duration-500">
      <audio ref={audioRef} preload="metadata"/>

      {/* Waveform */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-center gap-0.75 h-10">
          {bars.map((_, i) => (
            <span key={i} style={{
              width: "3px",
              borderRadius: "2px",
              height: playing ? `${12 + Math.sin(i * 0.5) * 10}px` : "5px",
              background: i / bars.length < progress
                ? "linear-gradient(to top, rgb(120,62,246), rgb(34,211,238))"
                : "rgba(255,255,255,0.1)",
              transition: "height 0.3s ease, background 0.3s",
              animationName:           playing ? "wave" : "none",
              animationDuration:       `${0.6 + (i % 5) * 0.1}s`,
              animationDelay:          `${i * 0.03}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
            }}/>
          ))}
        </div>
      </div>

      {/* Seek bar */}
      <div className="px-5 pb-1">
        <div className="relative h-1.5 bg-[#282846] rounded-full cursor-pointer group"
             onClick={handleSeek}>
          <div className="absolute inset-y-0 left-0 rounded-full
                          bg-linear-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)]"
               style={{ width: `${progress * 100}%` }}/>
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full
                          bg-white border-2 border-[rgb(120,62,246)] shadow
                          opacity-0 group-hover:opacity-100 transition-opacity"
               style={{ left: `calc(${progress * 100}% - 6px)` }}/>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] font-mono text-white/30">{formatTime(current)}</span>
          <span className="text-[10px] font-mono text-white/30">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pb-5 flex items-center gap-3">
        {/* Play / Pause */}
        <button onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-[rgb(120,62,246)]
                           hover:bg-[rgba(120,62,246,0.85)]
                           flex items-center justify-center text-white
                           transition-all hover:scale-105 active:scale-95 shrink-0"
                aria-label={playing ? "Pause" : "Play"}>
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <rect x="2" y="1" width="4" height="12" rx="1.5"/>
              <rect x="8" y="1" width="4" height="12" rx="1.5"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
              <path d="M2 1.5L12 7L2 12.5V1.5Z"/>
            </svg>
          )}
        </button>

        {/* Format badge */}
        <span className="text-[10px] font-mono text-white/30 border
                         border-[#282846] px-1.5 py-0.5 rounded shrink-0">
          {ext}
        </span>

        <div className="flex-1"/>

        {/* Regenerate */}
        {onRegenerate && (
          <button onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             text-xs text-white/40 hover:text-white/70
                             border border-[#282846] hover:border-white/20
                             transition-all duration-150">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M1 6A5 5 0 0 1 10.5 3.5M11 1v3h-3"/>
              <path d="M11 6A5 5 0 0 1 1.5 8.5M1 11V8h3"/>
            </svg>
            Regenerate
          </button>
        )}

        {/* Copy URL */}
        <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           text-xs transition-all duration-150 border
                           ${copied
                             ? 'text-green-400 border-green-500/30 bg-green-500/10'
                             : 'text-white/40 hover:text-white/70 border-[#282846] hover:border-white/20'
                           }">
          {copied ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 6l3 3 5-5"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="4" y="4" width="7" height="7" rx="1.5"/>
              <path d="M8 4V2.5A1.5 1.5 0 0 0 6.5 1h-4A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H4"/>
            </svg>
          )}
          {copied ? "Copied!" : "Copy URL"}
        </button>

        {/* Download */}
        <a href={url} download={`vocera-${requestId}.${format.split("_")[0]}`}
           className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      text-xs text-white/40 hover:text-white/70
                      border border-[#282846] hover:border-white/20
                      transition-all duration-150">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
               stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 1v7M3 5l3 3 3-3"/><path d="M1 10h10"/>
          </svg>
          Download
        </a>
      </div>
    </div>
  )
}