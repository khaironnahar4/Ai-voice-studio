"use client"

import { useState }   from "react"
import { useRouter }  from "next/navigation"

const PRO_FEATURES = [
  { icon: "🎙", text: "100,000 chars/month",       sub: "10× more than Free"          },
  { icon: "⚡", text: "500 requests/month",         sub: "25× more than Free"          },
  { icon: "🌟", text: "Premium neural voices",      sub: "ElevenLabs + Google Neural2" },
  { icon: "📦", text: "All audio formats",          sub: "MP3, WAV, OGG"               },
  { icon: "🔌", text: "REST API access",            sub: "Build your own integrations" },
  { icon: "🚀", text: "Priority generation queue",  sub: "Skip the line"               },
]

export function UpgradeCard() {
  const router              = useRouter()
  const [cycle, setCycle]   = useState<"monthly" | "yearly">("monthly")
  const [loading, setLoading] = useState(false)

  const price        = cycle === "yearly" ? 9.6 : 12
  const yearlySaving = (12 - 9.6) * 12

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res  = await fetch("/api/billing/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planSlug: "pro", billingCycle: cycle }),
      })
      const data = await res.json()
      if (data.url) router.push(data.url)
        console.log("Checkout URL:", data.url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, rgba(120,62,246,0.12) 0%, rgba(34,211,238,0.05) 100%)",
        border:     "1px solid rgba(120,62,246,0.35)",
      }}
    >
      {/* Top gradient bar */}
      <div className="h-0.75 bg-linear-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)]"/>

      {/* Background glow */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full
                   pointer-events-none blur-[50px]"
        style={{ background: "rgba(120,62,246,0.1)" }}
      />

      <div className="relative p-6">

        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4
                        mb-6 flex-wrap">
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1
                           rounded-full border border-[rgba(120,62,246,0.3)]
                           bg-[rgba(120,62,246,0.15)] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[rgb(34,211,238)]"/>
              <span className="text-[11px] text-[rgb(167,139,250)] font-semibold
                               tracking-wide uppercase">
                Upgrade to Pro
              </span>
            </div>

            <h3 className="text-xl font-bold text-white tracking-tight mb-1.5">
              Unlock the full power of Vocera AI
            </h3>
            <p className="text-sm text-white/40 leading-relaxed max-w-md">
              You&apor;re on the{" "}
              <span className="text-white/60 font-medium">Free plan</span>.
              Upgrade to Pro for 10× more characters, premium voices, and
              API access.
            </p>
          </div>

          {/* Billing cycle toggle */}
          <div className="flex items-center gap-1 bg-black/30
                          border border-[#282846] rounded-xl p-1 shrink-0">
            {(["monthly", "yearly"] as const).map(c => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg
                           text-xs font-medium transition-all capitalize
                           ${cycle === c
                             ? "bg-[rgb(120,62,246)] text-white"
                             : "text-white/35 hover:text-white/60"
                           }`}
              >
                {c}
                {c === "yearly" && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded
                    ${cycle === "yearly"
                      ? "bg-white/20 text-white"
                      : "bg-teal-500/20 text-teal-400"
                    }`}>
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Two-col: features + price card ───────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_260px]
                        gap-5 items-start">

          {/* Feature grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PRO_FEATURES.map(f => (
              <div
                key={f.text}
                className="flex items-start gap-3 p-3.5 rounded-xl
                           bg-black/25 border border-[rgba(40,40,70,0.8)]"
              >
                <span className="text-lg leading-none mt-0.5 shrink-0">
                  {f.icon}
                </span>
                <div>
                  <p className="text-[13px] font-medium text-white/78
                                leading-snug">
                    {f.text}
                  </p>
                  <p className="text-[11px] text-white/30 mt-0.5">
                    {f.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Price + CTA */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: "rgba(0,0,0,0.35)",
              border:     "1px solid rgba(120,62,246,0.25)",
            }}
          >
            {/* Price display */}
            <div className="text-center">
              <div className="flex items-end justify-center gap-1">
                <span className="text-[44px] font-bold text-white
                                 leading-none tracking-[-0.04em]">
                  ${price % 1 === 0 ? price : price.toFixed(1)}
                </span>
                <span className="text-sm text-white/35 mb-1.5">/mo</span>
              </div>
              {cycle === "yearly" ? (
                <p className="text-[12px] text-teal-400 mt-1.5">
                  Save ${yearlySaving.toFixed(0)}/year vs monthly
                </p>
              ) : (
                <p className="text-[11px] text-white/25 mt-1">
                  or $9.6/mo billed yearly
                </p>
              )}
            </div>

            {/* Trial notice */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg
                           bg-[rgba(34,211,238,0.08)]
                           border border-[rgba(34,211,238,0.2)]">
              <svg className="w-3.5 h-3.5 text-cyan-400 shrink-0"
                   viewBox="0 0 14 14" fill="none"
                   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="7" cy="7" r="5.5"/>
                <path d="M7 4.5v3.5"/>
              </svg>
              <span className="text-[12px] text-cyan-400 font-medium">
                7-day free trial included
              </span>
            </div>

            {/* CTA button */}
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl text-[15px] font-semibold
                         flex items-center justify-center gap-2
                         transition-all duration-200
                         ${loading
                           ? "opacity-70 cursor-not-allowed bg-[rgba(120,62,246,0.5)]"
                           : "bg-[rgb(120,62,246)] hover:bg-[rgba(120,62,246,0.85)] hover:scale-[1.01] active:scale-[0.99]"
                         } text-white`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border border-white/30
                                   border-t-white rounded-full animate-spin"/>
                  Redirecting…
                </>
              ) : (
                <>
                  Start 7-day free trial
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                       stroke="white" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1 7h12M8 2l5 5-5 5"/>
                  </svg>
                </>
              )}
            </button>

            {/* Reassurance list */}
            <div className="space-y-1.5">
              {[
                "No credit card required for trial",
                "Cancel anytime, no questions asked",
                "Instant access after signup",
              ].map(t => (
                <div key={t} className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-white/25 shrink-0"
                       viewBox="0 0 12 12" fill="none"
                       stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M2 6l2.5 2.5 5.5-5.5"/>
                  </svg>
                  <span className="text-[11px] text-white/30">{t}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}