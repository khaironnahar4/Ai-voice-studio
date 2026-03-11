import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

function BackgroundWave() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 200"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 w-full h-40 opacity-10 pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {[...Array(20)].map((_, i) => {
        const x = i * 72
        const h = 60 + Math.abs(Math.sin(i * 0.7)) * 140
        return (
          <rect
            key={i}
            x={x}
            y={200 - h}
            width={36}
            height={h}
            rx={6}
            fill="white"
          />
        )
      })}
    </svg>
  )
}

export default function CTABanner() {
  return (
    <section
      id="cta-banner"
      className="relative py-28 lg:py-40 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Gradient background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-br from-[#5B2FCE] via-vocera-purple to-[#8B3CF7]"
      />
      {/* Noise texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Glow orbs */}
      <div aria-hidden="true" className="absolute -top-32 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 left-1/4 w-60 h-60 bg-white/8 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative waveform */}
      <BackgroundWave />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2
          id="cta-heading"
          className="font-display font-extrabold text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight mb-6"
        >
          Your words,<br />spoken{' '}
          <span className="italic opacity-90">perfectly.</span>
        </h2>
        <p className="text-lg sm:text-xl text-white/75 mb-10 max-w-xl mx-auto leading-relaxed">
          Join 150,000+ creators, developers, and businesses already using Vocera to bring their text to life.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2.5 px-9 py-4.5 rounded-xl bg-white text-vocera-purple font-bold text-base hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
          >
            Start for Free — No Credit Card
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2.5 px-9 py-4.5 rounded-xl border-2 border-white/30 text-white font-semibold text-base hover:bg-white/10 hover:border-white/50 transition-all duration-200"
          >
            Talk to Sales
          </Link>
        </div>

        <p className="mt-6 text-white/50 text-sm">
          Free forever · No credit card · 200+ AI voices ready to go
        </p>
      </div>
    </section>
  )
}
