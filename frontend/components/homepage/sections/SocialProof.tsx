'use client'

import { Star } from 'lucide-react'
import { useScrollReveal } from '@/utils/useScrollReveal'

const STATS = [
  { value: 10000000, display: '10M+',  label: 'Texts Converted',  suffix: '+' },
  { value: 150000,   display: '150K+', label: 'Active Users',      suffix: '+' },
  { value: 4.9,      display: '4.9',   label: 'Average Rating',    suffix: '/5' },
  { value: 99.9,     display: '99.9%', label: 'Uptime SLA',        suffix: '%' },
] as const

const TESTIMONIALS = [
  {
    quote: "Vocera completely transformed how we produce our podcast. The voice quality is so natural that our listeners can't tell the difference. We've cut production time by 70%.",
    name:  'Sarah Chen',
    role:  'Podcast Producer at StoryLab',
    rating: 5,
  },
  {
    quote: "As a developer, the Vocera API is a dream. Clean endpoints, fast response times, and the SDK made integration trivial. Shipped TTS into our app in an afternoon.",
    name:  'Marcus Williams',
    role:  'Senior Engineer at Axon Labs',
    rating: 5,
  },
  {
    quote: "We use Vocera to narrate every course we publish. Having 200+ voice options means we match the right tone for each subject. Our student engagement is up 40%.",
    name:  'Priya Sharma',
    role:  'Head of eLearning at EduForge',
    rating: 5,
  },
] as const

const LOGOS = [
  'Axiom Corp', 'StoryLab', 'EduForge', 'Axon Labs',
  'Nebula Inc', 'Quill Media', 'Vertico AI', 'Brightpath',
] as const

export default function SocialProof() {
  const containerRef = useScrollReveal('.reveal')

  return (
    <section
      id="social-proof"
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative py-12 lg:py-16 bg-vocera-card/30"
      aria-labelledby="proof-heading"
    >
      <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-vocera-purple/20 to-transparent" />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats bar */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {STATS.map(({ display, label }) => (
            <div
              key={label}
              className="glass-card rounded-2xl px-6 py-7 text-center hover:border-vocera-purple/30 transition-colors duration-300"
            >
              <div className="font-display font-extrabold text-4xl lg:text-5xl text-white mb-1 tracking-tight">
                <span className="text-gradient">{display}</span>
              </div>
              <div className="text-vocera-muted text-sm font-medium">{label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials heading */}
        <div className="text-center mb-12">
          <span className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out inline-block text-xs font-bold uppercase tracking-widest text-vocera-violet mb-4">
            Loved by creators
          </span>
          <h2
            id="proof-heading"
            className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out font-display font-extrabold text-4xl sm:text-5xl text-white"
          >
            Trusted by{' '}
            <span className="text-gradient">150,000+</span> Teams
          </h2>
        </div>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20">
          {TESTIMONIALS.map((t, i) => (
            <blockquote
              key={t.name}
              className={[
                'reveal opacity-0 translate-y-8 transition-all duration-700 ease-out',
                'glass-card rounded-2xl p-6 flex flex-col gap-4',
                'border-l-2 border-l-vocera-purple',
                'hover:border-vocera-purple/40 transition-all duration-300',
              ].join(' ')}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1" aria-label={`${t.rating} out of 5 stars`}>
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-amber-400" fill="currentColor" />
                ))}
              </div>
              {/* Quote */}
              <p className="text-vocera-muted text-sm leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              {/* Attribution */}
              <footer className="flex items-center gap-3 pt-3 border-t border-white/6">
                <div className="w-9 h-9 rounded-full bg-vocera-purple/30 flex items-center justify-center font-bold text-sm text-vocera-violet">
                  {t.name[0]}
                </div>
                <div>
                  <cite className="not-italic font-semibold text-sm text-white block">{t.name}</cite>
                  <span className="text-[11px] text-vocera-subtle">{t.role}</span>
                </div>
              </footer>
            </blockquote>
          ))}
        </div>

        {/* Logo marquee */}
        <div className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out">
          <p className="text-center mx-auto text-xs font-semibold uppercase tracking-widest text-vocera-subtle mb-8">
            Trusted by teams at
          </p>
          <div className="relative overflow-hidden">
            {/* Fade masks */}
            <div aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-linear-to-r from-vocera-bg to-transparent pointer-events-none" />
            <div aria-hidden="true" className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-linear-to-l from-vocera-bg to-transparent pointer-events-none" />

            <div className="marquee-track flex gap-12 items-center" aria-label="Companies using Vocera">
              {[...LOGOS, ...LOGOS].map((logo, i) => (
                <span
                  key={`${logo}-${i}`}
                  className="shrink-0 font-display font-bold text-lg text-vocera-subtle hover:text-vocera-muted transition-colors duration-300 cursor-default"
                >
                  {logo}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`.revealed { opacity: 1 !important; transform: translateY(0) !important; }`}</style>
    </section>
  )
}
