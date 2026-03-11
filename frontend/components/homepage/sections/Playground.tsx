'use client'

import { useState } from 'react'
import { Play, Download, Share2, Pause, Mic, SlidersHorizontal } from 'lucide-react'
import { useScrollReveal } from '@/utils/useScrollReveal'

const VOICES = [
  { id: 'aria',   name: 'Aria',    accent: 'US English',      gender: 'F', style: 'Warm' },
  { id: 'james',  name: 'James',   accent: 'British',         gender: 'M', style: 'Professional' },
  { id: 'mia',    name: 'Mia',     accent: 'Australian',      gender: 'F', style: 'Energetic' },
  { id: 'leo',    name: 'Leo',     accent: 'US English',      gender: 'M', style: 'Calm' },
  { id: 'sofia',  name: 'Sofia',   accent: 'Spanish (ES)',    gender: 'F', style: 'Expressive' },
  { id: 'kai',    name: 'Kai',     accent: 'Neutral',         gender: 'N', style: 'Narration' },
] as const

type VoiceId = typeof VOICES[number]['id']

const EMOTIONS = ['Neutral', 'Happy', 'Serious', 'Calm', 'Excited'] as const
const FORMATS  = ['MP3', 'WAV', 'OGG', 'FLAC'] as const

function WaveformPlayer({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end justify-center gap-[2.5px] h-12" aria-hidden="true">
      {Array.from({ length: 36 }).map((_, i) => {
        const h = 20 + Math.abs(Math.sin(i * 0.55 + 0.5)) * 80
        return (
          <div
            key={i}
            className="wave-bar rounded-full w-[2.5px]"
            style={{
              height: `${h}%`,
              animationDelay: `${(i * 0.04).toFixed(2)}s`,
              animationPlayState: playing ? 'running' : 'paused',
              opacity: playing ? 1 : 0.3,
            }}
          />
        )
      })}
    </div>
  )
}

export default function Playground() {
  const containerRef = useScrollReveal('.reveal')

  const [text,     setText]    = useState("Vocera turns any text into natural, studio-quality voice — in seconds. Try it yourself below.")
  const [voice,    setVoice]   = useState<VoiceId>('aria')
  const [speed,    setSpeed]   = useState(1.0)
  const [pitch,    setPitch]   = useState(1.0)
  const [emotion,  setEmotion] = useState<string>('Neutral')
  const [format,   setFormat]  = useState<string>('MP3')
  const [loading,  setLoading] = useState(false)
  const [playing,  setPlaying] = useState(false)
  const [done,     setDone]    = useState(false)

  const maxChars = 1000

  const handleGenerate = async () => {
    if (!text.trim() || loading) return
    setDone(false)
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1800))
    setLoading(false)
    setDone(true)
    setPlaying(true)
    setTimeout(() => setPlaying(false), 8000)
  }

  const selectedVoiceData = VOICES.find((v) => v.id === voice)!

  return (
    <section
      id="playground"
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative py-24 lg:py-32 bg-vocera-card/50"
      aria-labelledby="playground-heading"
    >
      {/* Ambient glow */}
      <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vocera-purple/30 to-transparent" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-vocera-purple/20 to-transparent" />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out inline-block text-xs font-bold uppercase tracking-widest text-vocera-violet mb-4">
            Try It Now
          </span>
          <h2
            id="playground-heading"
            className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out font-display font-extrabold text-4xl sm:text-5xl text-white leading-tight"
          >
            The AI Voice{' '}
            <span className="text-gradient">Playground</span>
          </h2>
          <p className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out mt-4 text-vocera-muted text-lg max-w-xl mx-auto">
            No sign-up needed. Paste your text, pick a voice, and hear the result instantly.
          </p>
        </div>

        {/* Main playground card */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out glass-card rounded-3xl p-6 lg:p-8 shadow-card max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: text input */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <label htmlFor="playground-text" className="text-sm font-semibold text-white">
                  Your Text
                </label>
                <span className={['text-xs font-medium', text.length > maxChars * 0.9 ? 'text-amber-400' : 'text-vocera-subtle'].join(' ')}>
                  {text.length}/{maxChars}
                </span>
              </div>
              <textarea
                id="playground-text"
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, maxChars))}
                rows={9}
                placeholder="Paste or type your text here (up to 1,000 characters)…"
                className="w-full bg-black/30 border border-white/8 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-vocera-subtle resize-none focus:outline-none focus:ring-2 focus:ring-vocera-purple/50 transition-all duration-200 leading-relaxed"
              />

              {/* Controls row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Speed */}
                <div>
                  <label className="text-xs font-medium text-vocera-subtle mb-1.5 block">
                    Speed — {speed.toFixed(1)}x
                  </label>
                  <input
                    type="range" min={0.5} max={2.0} step={0.1}
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full accent-vocera-purple cursor-pointer"
                    aria-label={`Playback speed: ${speed.toFixed(1)}x`}
                  />
                </div>
                {/* Pitch */}
                <div>
                  <label className="text-xs font-medium text-vocera-subtle mb-1.5 block">
                    Pitch — {pitch.toFixed(1)}x
                  </label>
                  <input
                    type="range" min={0.5} max={2.0} step={0.1}
                    value={pitch}
                    onChange={(e) => setPitch(parseFloat(e.target.value))}
                    className="w-full accent-vocera-purple cursor-pointer"
                    aria-label={`Pitch level: ${pitch.toFixed(1)}x`}
                  />
                </div>
                {/* Emotion */}
                <div>
                  <label htmlFor="emotion-select" className="text-xs font-medium text-vocera-subtle mb-1.5 block">Emotion</label>
                  <select
                    id="emotion-select"
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vocera-purple/50"
                  >
                    {EMOTIONS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                {/* Format */}
                <div>
                  <label htmlFor="format-select" className="text-xs font-medium text-vocera-subtle mb-1.5 block">Format</label>
                  <select
                    id="format-select"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-black/30 border border-white/8 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vocera-purple/50"
                  >
                    {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Right: voice library */}
            <div className="flex flex-col gap-5">
              <p className="text-sm font-semibold text-white">Select Voice</p>
              <div className="grid grid-cols-2 gap-2.5 flex-1">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    aria-pressed={voice === v.id}
                    className={[
                      'relative flex flex-col items-start p-3.5 rounded-xl text-left transition-all duration-200 border',
                      voice === v.id
                        ? 'border-vocera-purple/60 bg-vocera-purple/15 shadow-glow-sm'
                        : 'border-white/6 bg-white/3 hover:bg-white/6 hover:border-white/12',
                    ].join(' ')}
                  >
                    {/* Avatar placeholder */}
                    <div className={[
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mb-2',
                      voice === v.id ? 'bg-vocera-purple text-white' : 'bg-white/10 text-vocera-muted',
                    ].join(' ')}>
                      {v.name[0]}
                    </div>
                    <div className="font-semibold text-sm text-white leading-none mb-1">{v.name}</div>
                    <div className="text-[11px] text-vocera-subtle">{v.accent}</div>
                    <span className={[
                      'mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      voice === v.id ? 'bg-vocera-purple/30 text-vocera-violet' : 'bg-white/6 text-vocera-subtle',
                    ].join(' ')}>
                      {v.style}
                    </span>
                  </button>
                ))}
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={loading || !text.trim()}
                className={[
                  'w-full flex items-center justify-center gap-2.5 py-4 rounded-xl font-bold text-sm transition-all duration-200',
                  loading || !text.trim()
                    ? 'bg-white/8 text-vocera-subtle cursor-not-allowed'
                    : 'bg-vocera-purple hover:bg-vocera-violet text-white glow-purple hover:glow-purple hover:scale-[1.01] active:scale-[0.99] cursor-pointer',
                ].join(' ')}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Audio…
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Generate Voice
                  </>
                )}
              </button>

              {/* Output player */}
              {done && (
                <div className="rounded-xl bg-black/30 border border-vocera-purple/20 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <button
                      onClick={() => setPlaying((p) => !p)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-vocera-purple hover:bg-vocera-violet transition-colors shrink-0"
                      aria-label={playing ? 'Pause audio' : 'Play audio'}
                    >
                      {playing
                        ? <Pause className="w-4 h-4 text-white" />
                        : <Play  className="w-4 h-4 text-white ml-0.5" fill="white" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <WaveformPlayer playing={playing} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-vocera-subtle">
                      {selectedVoiceData.name} · {format} · {speed}x speed
                    </span>
                    <div className="flex gap-2">
                      <button aria-label="Download audio" className="p-1.5 rounded-lg hover:bg-white/8 text-vocera-muted hover:text-white transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button aria-label="Share audio" className="p-1.5 rounded-lg hover:bg-white/8 text-vocera-muted hover:text-white transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Limit note */}
        <p className="text-center text-xs text-vocera-subtle mt-5">
          3 free conversions without an account ·{' '}
          <a href="/sign-up" className="text-vocera-violet hover:underline">Sign up free</a>{' '}
          for unlimited access
        </p>
      </div>

      <style>{`.revealed { opacity: 1 !important; transform: translateY(0) !important; }`}</style>
    </section>
  )
}
