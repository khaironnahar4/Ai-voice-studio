"use client"

import { useState }   from "react"
import { useRouter }  from "next/navigation"


interface Plan {
  id:                   string
  name:                 string
  slug:                 string
  priceMonthly:         number
  priceYearly:          number
  charLimitMonthly:     bigint | null
  requestLimitMonthly:  number | null
  hasPremiumVoices:     boolean
  hasApiAccess:         boolean
  concurrentJobs:       number
}

interface PlanCardsProps {
  plans:          Plan[]
  currentPlanId:  string | null
  currentStatus:  string | null
  stripeCustomerId: string | null
}

const PLAN_FEATURES: Record<string, string[]> = {
  free:     ["10,000 chars/month","20 requests/month","Standard voices","MP3 download","Audio library"],
  pro:      ["100,000 chars/month","500 requests/month","Premium voices","All formats","API access","Priority queue"],
  business: ["500,000 chars/month","Unlimited requests","All providers","Full API access","Team seats","Dedicated support"],
}

export function PlanCards({
  plans, currentPlanId, currentStatus, stripeCustomerId,
}: PlanCardsProps) {
  const router                    = useRouter()
  const [cycle,   setCycle]       = useState<"monthly"|"yearly">("monthly")
  const [loading, setLoading]     = useState<string | null>(null)
  const [portalLoading, setPortal] = useState(false)

  const hasActiveStripe = !!stripeCustomerId && currentStatus !== "expired"

  async function handleUpgrade(planSlug: string) {
    setLoading(planSlug)
    try {
      const res  = await fetch("/api/billing/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ planSlug, billingCycle: cycle }),
      })
      const data = await res.json()
      if (data.url) router.push(data.url)
      else          alert(data.error ?? "Checkout failed")
    } finally {
      setLoading(null)
    }
  }

  async function handlePortal() {
    setPortal(true)
    try {
      const res  = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) router.push(data.url)
    } finally {
      setPortal(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Heading + toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-medium text-white/75">Plans</h2>
          <p className="text-xs text-white/35 mt-0.5">
            Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex items-center gap-1 bg-[#0F0F1A] border
                        border-[#282846] rounded-xl p-1">
          {(["monthly","yearly"] as const).map(c => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg
                         text-xs font-medium transition-all duration-150 capitalize
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
                    : "bg-teal-500/15 text-teal-400"
                  }`}>
                  -20%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isCurrent = plan.id === currentPlanId
          const price     = cycle === "yearly"
            ? Math.round(plan.priceYearly / 12) / 100
            : plan.priceMonthly / 100
          const features  = PLAN_FEATURES[plan.slug] ?? []
          const isPro     = plan.slug === "pro"
          const isFree    = plan.slug === "free"

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-6 flex flex-col
                         transition-all duration-200
                         ${isPro
                           ? "border-[rgba(120,62,246,0.45)] bg-[rgba(120,62,246,0.06)]"
                           : isCurrent
                           ? "border-teal-500/30 bg-teal-500/5"
                           : "border-[#282846] bg-[#141424]"
                         }`}
            >
              {/* Popular badge */}
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2
                               px-4 py-1 rounded-full text-[11px] font-semibold
                               bg-linear-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)]
                               text-white whitespace-nowrap">
                  Most popular
                </div>
              )}

              {/* Current badge */}
              {isCurrent && !isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2
                               px-4 py-1 rounded-full text-[11px] font-semibold
                               bg-teal-500 text-white whitespace-nowrap">
                  Current plan
                </div>
              )}

              {/* Price */}
              <div className="mb-5">
                <p className="text-xs text-white/40 mb-2">{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-bold tracking-[-0.04em]
                                   text-white leading-none">
                    {price === 0 ? "Free" : `$${price % 1 === 0 ? price : price.toFixed(1)}`}
                  </span>
                  {price > 0 && (
                    <span className="text-xs text-white/30 mb-1.5">/mo</span>
                  )}
                </div>
                {cycle === "yearly" && price > 0 && (
                  <p className="text-[11px] text-teal-400">
                    Billed ${(plan.priceYearly / 100).toFixed(0)}/year
                  </p>
                )}
              </div>

              <div className="h-px bg-[#282846] mb-5"/>

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-white/55">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
                         stroke="rgb(34,211,238)" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M2 6.5l3 3 6-6"/>
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                hasActiveStripe ? (
                  <button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-medium
                               border border-[#282846] text-white/45
                               hover:text-white hover:border-white/20
                               transition-all disabled:opacity-50"
                  >
                    {portalLoading ? "Loading…" : "Manage subscription"}
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl text-xs font-medium
                                  text-center border border-teal-500/25
                                  text-teal-400 bg-teal-500/5">
                    ✓ Active
                  </div>
                )
              ) : isFree ? (
                <div className="w-full py-2.5 rounded-xl text-xs font-medium
                                text-center text-white/20 border border-[#282846]
                                cursor-default">
                  {currentPlanId ? "Downgrade via portal" : "Default plan"}
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.slug)}
                  disabled={loading === plan.slug}
                  className={`w-full py-2.5 rounded-xl text-xs font-medium
                             transition-all hover:scale-[1.01] active:scale-[0.99]
                             flex items-center justify-center gap-2
                             disabled:opacity-60 disabled:cursor-wait
                             ${isPro
                               ? "bg-[rgb(120,62,246)] text-white hover:bg-[rgba(120,62,246,0.85)]"
                               : "border border-[#282846] text-white/55 hover:text-white hover:border-white/25"
                             }`}
                >
                  {loading === plan.slug && (
                    <span className="w-3 h-3 border border-white/30
                                     border-t-white rounded-full animate-spin"/>
                  )}
                  {loading === plan.slug ? "Redirecting…" : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}