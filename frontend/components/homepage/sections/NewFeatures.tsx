// components/marketing/features.tsx
"use client"

import { useEffect, useRef } from "react"

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
           stroke="rgb(120,62,246)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M11 2C6 2 2 6 2 11s4 9 9 9 9-4 9-9-4-9-9-9z"/>
        <path d="M7 11l2.5 2.5 5.5-5"/>
      </svg>
    ),
    title:  "200+ Neural Voices",
    desc:   "Premium voices across 30+ languages including Bangla, Hindi, Arabic, Japanese, and more.",
    color:  "rgba(120,62,246,0.12)",
    border: "rgba(120,62,246,0.2)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
           stroke="rgb(34,211,238)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M11 2v3M11 17v3M4.22 4.22l2.12 2.12M15.66 15.66l2.12 2.12M2 11h3M17 11h3"/>
        <circle cx="11" cy="11" r="4"/>
      </svg>
    ),
    title:  "Lightning Fast",
    desc:   "Audio generated in under 2 seconds. SHA-256 content cache delivers identical requests instantly.",
    color:  "rgba(34,211,238,0.1)",
    border: "rgba(34,211,238,0.18)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
           stroke="rgb(167,139,250)" strokeWidth="1.5" strokeLinecap="round">
        <rect x="2" y="4" width="18" height="14" rx="3"/>
        <path d="M8 11h6M11 8v6"/>
      </svg>
    ),
    title:  "3 AI Providers",
    desc:   "Edge TTS, Google Cloud, ElevenLabs — best quality for every language and use case.",
    color:  "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.2)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
           stroke="rgb(93,202,165)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M11 2a9 9 0 1 0 0 18A9 9 0 0 0 11 2z"/>
        <path d="M11 6v5l3 3"/>
      </svg>
    ),
    title:  "Full Audio Library",
    desc:   "Every generation saved. Browse, replay, and download MP3, WAV, or OGG anytime.",
    color:  "rgba(93,202,165,0.1)",
    border: "rgba(93,202,165,0.2)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
           stroke="rgb(251,191,36)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M4 6h14M4 10h14M4 14h10"/>
        <path d="M16 16l3 3"/>
      </svg>
    ),
    title:  "REST API",
    desc:   "Simple developer API. Integrate TTS into any application with a single HTTP call.",
    color:  "rgba(251,191,36,0.1)",
    border: "rgba(251,191,36,0.2)",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
           stroke="rgb(248,113,113)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M11 3a8 8 0 1 0 0 16A8 8 0 0 0 11 3z"/>
        <path d="M8 11s.8 2 3 2 3-2 3-2"/>
        <path d="M8.5 8.5h.01M13.5 8.5h.01"/>
      </svg>
    ),
    title:  "SSML Support",
    desc:   "Fine-tune pronunciation, pauses, emphasis and speed with Speech Synthesis Markup Language.",
    color:  "rgba(248,113,113,0.1)",
    border: "rgba(248,113,113,0.2)",
  },
]

export function Features() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const cards = sectionRef.current?.querySelectorAll(".feat-card")
    if (!cards) return

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => {
            ;(e.target as HTMLElement).style.opacity    = "1"
            ;(e.target as HTMLElement).style.transform  = "translateY(0)"
          }, i * 80)
        }
      })
    }, { threshold: 0.1 })

    cards.forEach(c => obs.observe(c))
    return () => obs.disconnect()
  }, [])

  return (
    <section id="features" ref={sectionRef}
             className="py-24 md:py-32 px-5">
      <div className="max-w-[1200px] mx-auto">

        {/* Heading */}
        <div className="text-center mb-14 reveal-heading">
          <p className="text-[12px] text-[rgb(167,139,250)] uppercase
                        tracking-[0.12em] font-medium mb-3">
            Why Vocera AI
          </p>
          <h2 className="text-[clamp(28px,4vw,52px)] font-bold
                         tracking-[-0.035em] mb-4 leading-tight">
            Everything for perfect
            <span className="bg-gradient-to-r from-[rgb(167,139,250)]
                             to-[rgb(34,211,238)] bg-clip-text text-transparent">
              {" "}voice content
            </span>
          </h2>
          <p className="text-[16px] text-white/40 max-w-[480px] mx-auto
                        leading-relaxed">
            From quick demos to production-grade voice pipelines.
            Vocera handles it all.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="feat-card group rounded-2xl border p-7
                         transition-all duration-300 cursor-default
                         hover:-translate-y-1 hover:shadow-lg"
              style={{
                opacity:         0,
                transform:       "translateY(28px)",
                transition:      "opacity 0.6s ease, transform 0.6s ease, border-color 0.2s, box-shadow 0.2s",
                background:      f.color,
                borderColor:     f.border,
              }}
            >
              <div className="w-11 h-11 rounded-xl border flex items-center
                              justify-center mb-5"
                   style={{ borderColor: f.border, background: "rgba(0,0,0,0.2)" }}>
                {f.icon}
              </div>
              <h3 className="text-[16px] font-semibold mb-2.5 tracking-tight">
                {f.title}
              </h3>
              <p className="text-[13px] text-white/45 leading-[1.7]">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}