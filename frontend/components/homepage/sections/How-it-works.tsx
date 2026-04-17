"use client"

import { useEffect, useRef } from "react"

const STEPS = [
  {
    n:    "01",
    title: "Write your text",
    desc:  "Type or paste any content — articles, scripts, product descriptions. Up to 10,000 characters per request.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
           stroke="rgb(167,139,250)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6 7h16M6 12h16M6 17h10"/>
      </svg>
    ),
  },
  {
    n:    "02",
    title: "Choose your voice",
    desc:  "Pick from 200+ neural voices. Filter by language, gender, style. Click to preview before generating.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
           stroke="rgb(34,211,238)" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="14" cy="10" r="4"/>
        <path d="M7 22c0-4 3.1-7 7-7s7 3 7 7"/>
      </svg>
    ),
  },
  {
    n:    "03",
    title: "Download audio",
    desc:  "Audio ready in under 2 seconds. Download MP3, WAV, or OGG. Embed anywhere or use the API.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
           stroke="rgb(120,62,246)" strokeWidth="1.5" strokeLinecap="round">
        <path d="M14 4v14M8 12l6 6 6-6"/><path d="M4 22h20"/>
      </svg>
    ),
  },
]

export function HowItWorks() {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const items = ref.current?.querySelectorAll(".step-item")
    const line  = ref.current?.querySelector(".progress-line") as HTMLElement
    if (!items) return

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          items.forEach((item, i) => {
            setTimeout(() => {
              ;(item as HTMLElement).style.opacity   = "1"
              ;(item as HTMLElement).style.transform = "translateY(0)"
            }, i * 150)
          })
          if (line) {
            setTimeout(() => { line.style.width = "100%" }, 200)
          }
        }
      })
    }, { threshold: 0.2 })

    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="how-it-works" ref={ref}
             className="py-24 px-5 border-t border-b border-[rgba(40,40,70,0.5)]
                        bg-[rgba(120,62,246,0.03)]">
      <div className="max-w-[900px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-[clamp(26px,3.5vw,48px)] font-bold
                         tracking-[-0.035em] mb-3">
            Generate audio in 3 steps
          </h2>
          <p className="text-[15px] text-white/40">
            No setup. No configuration. Text in, audio out.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-10 left-[16.5%]
                          right-[16.5%] h-px bg-[#282846] overflow-hidden">
            <div className="progress-line h-full bg-gradient-to-r
                            from-[rgb(120,62,246)] to-[rgb(34,211,238)]"
                 style={{ width: "0%", transition: "width 1.2s cubic-bezier(0.16,1,0.3,1)" }}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {STEPS.map((step, i) => (
              <div key={step.n}
                   className="step-item flex flex-col items-center text-center"
                   style={{
                     opacity: 0,
                     transform: "translateY(30px)",
                     transition: "opacity 0.7s ease, transform 0.7s ease",
                   }}>
                {/* Number circle */}
                <div className="relative w-20 h-20 rounded-2xl border
                                border-[rgba(120,62,246,0.3)]
                                bg-[rgba(120,62,246,0.1)]
                                flex items-center justify-center mb-6 z-10">
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6
                                   rounded-full bg-[rgb(120,62,246)]
                                   text-white text-[10px] font-bold
                                   flex items-center justify-center font-mono">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold mb-2.5">{step.title}</h3>
                <p className="text-[13px] text-white/40 leading-[1.7] max-w-[240px]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}