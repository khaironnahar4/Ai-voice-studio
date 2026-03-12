'use client'

import { useState } from 'react'
import { Mic2, Code2, BookOpen, Building2 } from 'lucide-react'
import { useScrollReveal } from '@/utils/useScrollReveal'

const TABS = [
  {
    id:       'creators',
    label:    'Content Creators',
    icon:     Mic2,
    heading:  'Give Your Content a Voice',
    desc:     'From YouTube voiceovers to podcast narration — Vocera gives content creators a professional voice without a studio or a microphone. Ship more content, faster.',
    features: ['Podcast episode narration', 'YouTube & TikTok voiceovers', 'Social media audio clips', 'Audiobook production', 'Script read-throughs'],
    stat:     { value: '70%', label: 'faster content production' },
  },
  {
    id:       'developers',
    label:    'Developers',
    icon:     Code2,
    heading:  'A TTS API Built for Scale',
    desc:     "Integrate Vocera's REST API into any app in minutes. SDKs for Node.js, Python, Go, and more. Built for high throughput and production reliability.",
    features: ['REST API & Webhooks', 'Node.js, Python, Go SDKs', 'Batch processing endpoint', 'Stream audio in real-time', 'SSML & phoneme support'],
    stat:     { value: '<200ms', label: 'average API response time' },
  },
  {
    id:       'educators',
    label:    'Educators',
    icon:     BookOpen,
    heading:  'Narrate Every Lesson, Automatically',
    desc:     "Turn written course content into engaging narrated lessons. Support learners in 50+ languages with accessible, natural-sounding audio for every module.",
    features: ['eLearning course narration', 'Audiobook generation', 'Lecture-to-audio conversion', 'Multi-language support', 'Accessibility compliance'],
    stat:     { value: '+40%', label: 'learner engagement increase' },
  },
  {
    id:       'business',
    label:    'Businesses',
    icon:     Building2,
    heading:  'Enterprise Voice, at Scale',
    desc:     'Power IVR systems, product demos, customer onboarding, and internal training with consistent, brand-aligned AI voice — across every touchpoint.',
    features: ['IVR & telephony systems', 'Customer onboarding audio', 'Product demo narration', 'Internal training content', 'White-label voice branding'],
    stat:     { value: '3x', label: 'ROI vs. recording studio' },
  },
] as const

type TabId = typeof TABS[number]['id']

export default function UseCases() {
  // const containerRef = useScrollReveal('.reveal')
  const [activeTab, setTab] = useState<TabId>('creators')

  const tab = TABS.find((t) => t.id === activeTab)!

  return (
    <section
      id="use-cases"
      // ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative py-12 lg:py-16 bg-vocera-card/30"
      aria-labelledby="usecases-heading"
    >
      <div  className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/6 to-transparent" />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12">
          <span className="reveala opacity-100 translate-y-8 transition-all duration-700 ease-out inline-block text-xs font-bold uppercase tracking-widest text-vocera-violet mb-4">
            Built for Everyone
          </span>
          <h2
            id="usecases-heading"
            className="reveala opacity-100 translate-y-8 transition-all duration-700 ease-out font-display font-extrabold text-4xl sm:text-5xl text-white leading-tight"
          >
            How Will You Use{' '}
            <span className="text-gradient">Vocera?</span>
          </h2>
        </div>

        {/* Tab buttons */}
        <div
          className="reveala opacity-100 translate-y-8 transition-all duration-700 ease-out flex flex-wrap justify-center gap-3 mb-12"
          role="tablist"
          aria-label="Use case categories"
        >
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`tabpanel-${id}`}
              id={`tab-${id}`}
              onClick={() => setTab(id)}
              className={[
                'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200',
                activeTab === id
                  ? 'bg-vocera-purple text-white shadow-glow-sm'
                  : 'glass border border-white/6 text-vocera-muted hover:text-white hover:bg-white/6',
              ].join(' ')}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab panel */}
        <div
          id={`tabpanel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="reveala opacity-100 translate-y-8 transition-all duration-700 ease-out"
          key={activeTab}
        >
          <div className="glass-card rounded-3xl p-8 lg:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Text */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-vocera-purple/20 flex items-center justify-center">
                  <tab.icon className="w-5 h-5 text-vocera-violet" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-vocera-violet">
                  {tab.label}
                </span>
              </div>

              <h3 className="font-display font-bold text-3xl lg:text-4xl text-white leading-snug">
                {tab.heading}
              </h3>
              <p className="text-vocera-muted text-base leading-relaxed">
                {tab.desc}
              </p>

              <ul className="flex flex-col gap-2.5" role="list">
                {tab.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-vocera-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-vocera-violet shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="/sign-up"
                className="self-start inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-vocera-purple hover:bg-vocera-violet text-white font-semibold text-sm transition-all duration-200 glow-purple hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started Free
              </a>
            </div>

            {/* Stat card */}
            <div className="flex items-center justify-center">
              <div className="relative glass rounded-3xl p-10 text-center max-w-sm w-full border border-vocera-purple/20">
                <div
                  
                  className="absolute inset-0 rounded-3xl bg-linear-to-br from-vocera-purple/15 to-transparent pointer-events-none"
                />
                <div className="font-display font-extrabold text-7xl lg:text-8xl text-gradient leading-none mb-3">
                  {tab.stat.value}
                </div>
                <div className="text-vocera-muted text-base font-medium">
                  {tab.stat.label}
                </div>
                <div className="mt-6 pt-6 border-t border-white/8 text-xs text-vocera-subtle">
                  Based on average customer results
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`.revealed { opacity: 1 !important; transform: translateY(0) !important; }`}</style>
    </section>
  )
}
