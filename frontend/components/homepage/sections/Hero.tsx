'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { Play, ArrowRight, Mic, Globe2, Zap, ChevronDown } from 'lucide-react'
import ParticleSphere from '@/components/3D/ParticleSphere'

const TRUST_STATS = [
  { icon: Mic,    value: '10M+',  label: 'Conversions' },
  { icon: Globe2, value: '50+',   label: 'Languages' },
  { icon: Zap,    value: '200+',  label: 'AI Voices' },
] as const

const SAMPLE_VOICES = [
  { name: 'Aria',  accent: 'US English',      color: '#9B6FF5' },
  { name: 'James', accent: 'British English', color: '#6C3CE1' },
  { name: 'Mia',   accent: 'Australian',      color: '#a855f7' },
] as const

function WaveformVisualizer({ playing }: { playing: boolean }) {
  return (
    <div
      className="flex items-end justify-center gap-[3px] h-10"
      role="img"
      aria-label={playing ? 'Audio playing' : 'Audio paused'}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={[
            'wave-bar w-[3px] rounded-full',
            playing ? '' : 'opacity-40',
          ].join(' ')}
          style={{
            height: `${30 + Math.sin(i * 0.8) * 20}%`,
            animationPlayState: playing ? 'running' : 'paused',
            animationDelay: `${(i * 0.06).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  )
}

function LiveDemoWidget() {
  const [text,          setText]     = useState("The future of voice is here. Vocera transforms your words into natural, expressive speech.")
  const [selectedVoice, setVoice]    = useState(0)
  const [playing,       setPlaying]  = useState(false)
  const [loading,       setLoading]  = useState(false)
  const [converted,     setConverted] = useState(false)
  const charLimit = 300

  const handleConvert = async () => {
    if (!text.trim() || loading) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1400))
    setLoading(false)
    setConverted(true)
    setPlaying(true)
    setTimeout(() => setPlaying(false), 6000)
  }

  return (
    <div className="glass-card rounded-2xl p-6 shadow-card w-full max-w-md mx-auto lg:mx-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-vocera-muted uppercase tracking-widest">
            Live Demo
          </span>
        </div>
        <span className="text-xs text-vocera-subtle">
          {text.length}/{charLimit}
        </span>
      </div>

      {/* Voice selector */}
      <div className="flex gap-2 mb-4">
        {SAMPLE_VOICES.map((v, i) => (
          <button
            key={v.name}
            onClick={() => setVoice(i)}
            aria-pressed={selectedVoice === i}
            className={[
              'flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200',
              selectedVoice === i
                ? 'bg-vocera-purple text-white shadow-glow-sm'
                : 'bg-white/5 text-vocera-muted hover:bg-white/10 hover:text-white',
            ].join(' ')}
          >
            <div className="font-bold">{v.name}</div>
            <div className="text-[10px] opacity-70 mt-0.5 font-normal">{v.accent}</div>
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, charLimit))}
        rows={4}
        placeholder="Type or paste your text here…"
        className="w-full bg-black/20 border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-vocera-subtle resize-none focus:outline-none focus:ring-2 focus:ring-vocera-purple/50 transition-all duration-200 mb-4"
        aria-label="Text to convert to speech"
      />

      {/* Convert button */}
      <button
        onClick={handleConvert}
        disabled={loading || !text.trim()}
        className={[
          'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200',
          loading || !text.trim()
            ? 'bg-white/10 text-vocera-subtle cursor-not-allowed'
            : 'bg-vocera-purple hover:bg-vocera-violet text-white glow-purple hover:glow-purple cursor-pointer',
        ].join(' ')}
        aria-label="Convert text to speech"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating voice…
          </>
        ) : (
          <>
            <Mic className="w-4 h-4" />
            Convert to Speech
          </>
        )}
      </button>

      {/* Audio Player (shown after conversion) */}
      {converted && (
        <div className="mt-4 p-3 rounded-xl bg-black/20 border border-white/8">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setPlaying((p) => !p)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-vocera-purple hover:bg-vocera-violet transition-colors shrink-0"
              aria-label={playing ? 'Pause audio' : 'Play audio'}
            >
              {playing ? (
                <span className="flex gap-0.5">
                  <span className="w-1 h-3 bg-white rounded-sm" />
                  <span className="w-1 h-3 bg-white rounded-sm" />
                </span>
              ) : (
                <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
              )}
            </button>
            <WaveformVisualizer playing={playing} />
            <span className="text-xs text-vocera-muted ml-auto shrink-0">0:06</span>
          </div>
          <div className="text-[11px] text-vocera-subtle text-center">
            Voice: {SAMPLE_VOICES[selectedVoice].name} · {SAMPLE_VOICES[selectedVoice].accent}
          </div>
        </div>
      )}

      {/* No sign-up note */}
      <p className="text-center text-[11px] text-vocera-subtle mt-3">
        No account required · 3 free conversions
      </p>
    </div>
  )
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)

  // Simple entrance animation via CSS class toggle
  useEffect(() => {
    const els = containerRef.current?.querySelectorAll('.hero-reveal')
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    els?.forEach((el, i) => {
      ;(el as HTMLElement).style.transitionDelay = `${i * 100}ms`
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.add('opacity-100', 'translate-y-0')
        })
      })
    })
  }, [])

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden mesh-bg"
      aria-label="Hero section"
    >
      {/* Decorative glow orbs */}
      <div
        aria-hidden="true"
        className="absolute -top-32 left-1/4 w-[600px] h-[600px] rounded-full bg-vocera-purple/10 blur-[120px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full bg-vocera-violet/8 blur-[100px] pointer-events-none"
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left Column ── */}
          <div className="flex flex-col gap-6">
            {/* Badge */}
            <div className="hero-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out inline-flex items-center self-start">
              <span className="pulse-dot inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 text-xs font-semibold text-vocera-muted uppercase tracking-widest">
                New — 200+ AI Voices Available
              </span>
            </div>

            {/* Headline */}
            <h1 className="hero-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-white">
              Transform Text Into{' '}
              <span className="text-gradient glow-text block sm:inline">
                Lifelike Voice
              </span>
            </h1>

            {/* Subheading */}
            <p className="hero-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out text-lg text-vocera-muted leading-relaxed max-w-lg">
              Vocera uses cutting-edge AI to convert any text into natural, expressive speech — in 200+ voices, 50+ languages, and studio-quality audio. Instantly.
            </p>

            {/* CTAs */}
            <div className="hero-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out flex flex-col sm:flex-row gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-vocera-purple hover:bg-vocera-violet text-white font-semibold text-base transition-all duration-200 glow-purple hover:glow-purple hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vocera-violet"
              >
                Start Converting Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  document.querySelector('#voices')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl border border-white/10 text-white font-semibold text-base hover:bg-white/5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                <Play className="w-4 h-4 text-vocera-violet" fill="currentColor" />
                Hear Sample Voices
              </button>
            </div>

            {/* Trust stats */}
            <div className="hero-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out flex flex-wrap items-center gap-6 pt-2">
              {TRUST_STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-vocera-purple/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-vocera-violet" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm leading-none">{value}</div>
                    <div className="text-vocera-subtle text-xs mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Column — Demo Widget ── */}
          {/* <div className="hero-reveal opacity-0 translate-y-8 transition-all duration-700 ease-out flex justify-center lg:justify-end">
            <LiveDemoWidget />
           
          </div> */}
           
          <div style={{ flex:"1 1 440px", height:"520px", position:"relative", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ position:"absolute", width:"380px", height:"380px", borderRadius:"50%", background:"radial-gradient(circle, rgba(120,62,246,0.18) 0%, transparent 70%)", animation:"glowPulse 3s ease-in-out infinite" }}/>
              <div style={{ width:"100%", height:"100%", position:"relative", zIndex:1 }}>
                <ParticleSphere/>
              </div>
            </div>
          </div>

        {/* Scroll hint */}
        <div className="flex justify-center mt-20">
          <button
            onClick={() => document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-2 text-vocera-subtle hover:text-vocera-muted transition-colors group"
            aria-label="Scroll to features"
          >
            <span className="text-xs uppercase tracking-widest font-medium">Explore</span>
            <ChevronDown className="w-4 h-4 animate-bounce group-hover:text-vocera-violet transition-colors" />
          </button>
        </div>
      </div>
    </section>
  )
}
