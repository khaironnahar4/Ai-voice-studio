'use client'

// import { useRef } from 'react'
import { Mic2, Globe2, Zap, Code2, SlidersHorizontal, ShieldCheck } from 'lucide-react'
import { useScrollReveal } from '@/utils/useScrollReveal'
import FeatureCard from './FeatureCard'


const FEATURES = [
  {
    icon:       Mic2,
    title:      'Lifelike AI Voices',
    desc:       '200+ premium voices trained on hours of real speech data — indistinguishable from human narrators.',
    stat:       '200+ Voices',
    size:       'lg',    // bento size class
    accent:     true,
  },
  {
    icon:       Globe2,
    title:      'Multi-language Support',
    desc:       'Reach a global audience with support for 50+ languages and regional accents.',
    stat:       '50+ Languages',
    size:       'sm',
    accent:     false,
  },
  {
    icon:       Zap,
    title:      'Real-time Preview',
    desc:       'Hear your voice conversion in under 2 seconds. Iterate instantly without waiting.',
    stat:       '<2s Latency',
    size:       'sm',
    accent:     false,
  },
  {
    icon:       Code2,
    title:      'Developer API',
    desc:       'Integrate Vocera into any app with our REST API. Comprehensive docs & SDK for Node, Python, and more.',
    stat:       'REST + SDK',
    size:       'lg',
    accent:     false,
    code:       true,
  },
  {
    icon:       SlidersHorizontal,
    title:      'Emotion & Tone Control',
    desc:       'Fine-tune pitch, speed, emotion, and pause patterns for fully expressive voice output.',
    stat:       'Full Control',
    size:       'sm',
    accent:     false,
  },
  {
    icon:       ShieldCheck,
    title:      'Enterprise Security',
    desc:       'SOC 2 Type II certified. All audio is encrypted in transit and at rest. GDPR compliant.',
    stat:       'SOC2 · GDPR',
    size:       'sm',
    accent:     false,
  },
] as const


export default function Features() {
  const containerRef = useScrollReveal('.reveal')

  return (
    <section
      id="features"
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative py-12 lg:py-16"
      aria-labelledby="features-heading"
    >
      {/* Section glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-100 bg-vocera-purple/6 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <span className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out inline-block text-xs font-bold uppercase tracking-widest text-vocera-violet mb-4">
            Why Vocera
          </span>
          <h2
            id="features-heading"
            className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight tracking-tight"
          >
            Everything You Need for{' '}
            <span className="text-gradient">Perfect AI Voice</span>
          </h2>
          <p className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out mt-5 text-vocera-muted text-lg max-w-2xl mx-auto leading-relaxed">
            Professional-grade voice synthesis with the controls and integrations that modern teams demand.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>

      {/* Inject CSS for .revealed state */}
      <style>{`
        .revealed { opacity: 1 !important; transform: translateY(0) !important; }
      `}</style>
    </section>
  )
}
