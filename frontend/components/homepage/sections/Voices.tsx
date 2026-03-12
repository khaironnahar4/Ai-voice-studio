'use client'

import { useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { useScrollReveal } from '@/utils/useScrollReveal'

const FILTERS = ['All', 'Male', 'Female', 'Narration', 'Conversational', 'News'] as const
type Filter = typeof FILTERS[number]

const VOICES = [
  { id: 'aria',   name: 'Aria',   accent: 'US English',      gender: 'F', style: 'Warm',          tags: ['Female', 'Conversational'], initials: 'AR', hue: '#9B6FF5' },
  { id: 'james',  name: 'James',  accent: 'British English', gender: 'M', style: 'Professional',  tags: ['Male', 'Narration', 'News'], initials: 'JA', hue: '#6C3CE1' },
  { id: 'mia',    name: 'Mia',    accent: 'Australian',      gender: 'F', style: 'Energetic',      tags: ['Female', 'Conversational'], initials: 'MI', hue: '#a855f7' },
  { id: 'leo',    name: 'Leo',    accent: 'US English',      gender: 'M', style: 'Calm',           tags: ['Male', 'Narration'],        initials: 'LE', hue: '#7c3aed' },
  { id: 'sofia',  name: 'Sofia',  accent: 'Spanish (ES)',    gender: 'F', style: 'Expressive',     tags: ['Female', 'Conversational'], initials: 'SO', hue: '#8b5cf6' },
  { id: 'kai',    name: 'Kai',    accent: 'Neutral',         gender: 'N', style: 'Narration',      tags: ['Narration'],                initials: 'KA', hue: '#6366f1' },
  { id: 'nova',   name: 'Nova',   accent: 'US English',      gender: 'F', style: 'News Anchor',    tags: ['Female', 'News'],           initials: 'NO', hue: '#8b5cf6' },
  { id: 'ethan',  name: 'Ethan',  accent: 'Irish',           gender: 'M', style: 'Storyteller',   tags: ['Male', 'Narration'],        initials: 'ET', hue: '#7c3aed' },
  { id: 'zara',   name: 'Zara',   accent: 'South African',   gender: 'F', style: 'Bright',         tags: ['Female', 'Conversational'], initials: 'ZA', hue: '#a21caf' },
] as const

type VoiceId = typeof VOICES[number]['id']

function MiniWave({ playing }: { playing: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-5" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="wave-bar w-0.5"
          style={{
            height: `${30 + Math.abs(Math.sin(i * 1.1)) * 70}%`,
            animationDelay: `${(i * 0.08).toFixed(2)}s`,
            animationPlayState: playing ? 'running' : 'paused',
            opacity: playing ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  )
}

export default function Voices() {
  const containerRef = useScrollReveal('.reveal')

  const [activeFilter, setFilter]  = useState<Filter>('All')
  const [playingId,    setPlaying] = useState<VoiceId | null>(null)

  const filtered = activeFilter === 'All'
    ? VOICES
    : VOICES.filter((v) => v.tags.includes(activeFilter as string))

  const handlePlay = (id: VoiceId) => {
    if (playingId === id) {
      setPlaying(null)
    } else {
      setPlaying(id)
      setTimeout(() => setPlaying((p) => (p === id ? null : p)), 5000)
    }
  }

  return (
    <section
      id="voices"
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative py-12 lg:py-16"
      aria-labelledby="voices-heading"
    >
      <div
        aria-hidden="true"
        className="absolute bottom-0 right-0 w-125 h-125 bg-vocera-violet/6 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out inline-block text-xs font-bold uppercase tracking-widest text-vocera-violet mb-4">
            Voice Library
          </span>
          <h2
            id="voices-heading"
            className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out font-display font-extrabold text-4xl sm:text-5xl text-white leading-tight"
          >
            200+ Voices. Endless{' '}
            <span className="text-gradient">Possibilities.</span>
          </h2>
          <p className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out mt-4 text-vocera-muted text-lg max-w-xl mx-auto">
            Preview any voice instantly. Find the perfect tone for your project.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out flex flex-wrap justify-center gap-2 mb-10" role="tablist" aria-label="Filter voices by type">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={activeFilter === f}
              onClick={() => setFilter(f)}
              className={[
                'px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200',
                activeFilter === f
                  ? 'bg-vocera-purple text-white shadow-glow-sm'
                  : 'glass text-vocera-muted hover:text-white hover:bg-white/8 border border-white/6',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Voice grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((voice, i) => {
            const isPlaying = playingId === voice.id
            return (
              <article
                key={voice.id}
                className={[
                  'reveal opacity-0 translate-y-8 transition-all duration-700 ease-out',
                  'glass-card rounded-2xl p-5 flex items-center gap-4',
                  ' hover:border-vocera-purple/30 transition-all duration-300 group',
                ].join(' ')}
                style={{ transitionDelay: `${Math.min(i * 60, 300)}ms` }}
              >
                {/* Avatar */}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${voice.hue}99, ${voice.hue})` }}
                  aria-hidden="true"
                >
                  {voice.initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-white text-base">{voice.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-vocera-purple/15 text-vocera-violet font-semibold border border-vocera-purple/20">
                      {voice.style}
                    </span>
                  </div>
                  <div className="text-xs text-vocera-muted mb-2">{voice.accent}</div>
                  {isPlaying && <MiniWave playing={true} />}
                </div>

                {/* Play button */}
                <button
                  onClick={() => handlePlay(voice.id)}
                  aria-label={isPlaying ? `Pause ${voice.name}` : `Play ${voice.name} sample`}
                  className={[
                    'w-10 h-10 flex items-center justify-center rounded-full shrink-0 transition-all duration-200',
                    isPlaying
                      ? 'bg-vocera-violet text-white shadow-glow-sm scale-110'
                      : 'bg-white/8 text-vocera-muted hover:bg-vocera-purple hover:text-white hover:scale-110',
                  ].join(' ')}
                >
                  {isPlaying
                    ? <Pause className="w-4 h-4" />
                    : <Play  className="w-4 h-4 ml-0.5" fill="currentColor" />
                  }
                </button>
              </article>
            )
          })}
        </div>

        {/* CTA */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out text-center mt-12">
          <a
            href="/voices"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-vocera-purple/30 text-vocera-violet font-semibold hover:bg-vocera-purple/10 hover:border-vocera-purple/60 transition-all duration-200 text-sm"
          >
            Browse All 200+ Voices
            <span className="text-vocera-subtle">→</span>
          </a>
        </div>
      </div>

      <style>{`.revealed { opacity: 1 !important; transform: translateY(0) !important; }`}</style>
    </section>
  )
}
