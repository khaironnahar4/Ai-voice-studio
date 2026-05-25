"use client"


interface UsageCardProps {
  charsUsed:  number
  charLimit:  number | null
  planName:   string
  periodEnd:  Date | null
  status:     string
  trialEndsAt: Date | null
}

export function UsageCard({
  charsUsed, charLimit, planName,
  periodEnd, status, trialEndsAt,
}: UsageCardProps) {
  const limit   = charLimit ? Number(charLimit) : null
  const pct     = limit ? Math.min(Math.round((charsUsed / limit) * 100), 100) : 0
  const barColor =
    pct > 90 ? "bg-red-500" :
    pct > 70 ? "bg-amber-500" :
    "bg-gradient-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)]"

  const isTrialing = status === "trialing"
  const isPastDue  = status === "past_due"

  return (
    <div className="rounded-2xl border border-[#282846] bg-[#141424] p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-sm font-medium text-white/80">
              Current plan
            </span>
            {isPastDue && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                             bg-red-500/15 text-red-400 border border-red-500/25">
                Payment due
              </span>
            )}
            {isTrialing && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold
                             bg-teal-500/15 text-teal-400 border border-teal-500/25">
                Trial
              </span>
            )}
          </div>
          <p className="text-2xl font-bold text-white tracking-tight">
            {planName}
          </p>
          {periodEnd && (
            <p className="text-xs text-white/30 mt-1">
              {isTrialing
                ? `Trial ends ${new Date(trialEndsAt!).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
                : `Renews ${new Date(periodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`
              }
            </p>
          )}
        </div>

        {isPastDue && (
          <button
            onClick={() => fetch("/api/billing/portal", { method: "POST" })
              .then(r => r.json()).then(d => d.url && (window.location.href = d.url))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-xs font-medium bg-red-500/15 text-red-400
                       border border-red-500/25 hover:bg-red-500/25
                       transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M6 1a5 5 0 1 0 0 10A5 5 0 0 0 6 1zm0 3a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0v-2A.75.75 0 0 1 6 4zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            Update payment
          </button>
        )}
      </div>

      {/* Character usage */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-white/40">Character usage</span>
          <span className="font-mono text-white/50">
            {charsUsed.toLocaleString()}
            {limit && ` / ${limit.toLocaleString()}`}
          </span>
        </div>

        {limit ? (
          <>
            <div className="h-2 bg-[#282846] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-white/20">0</span>
              <span className={`text-[11px] font-medium
                ${pct > 90 ? "text-red-400" : pct > 70 ? "text-amber-400" : "text-white/35"}`}>
                {pct}% used
              </span>
            </div>

            {pct >= 80 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                             bg-amber-500/8 border border-amber-500/20 mt-1">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"
                     className="text-amber-400 shrink-0">
                  <path d="M7 1L1 12h12L7 1zm0 3.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 1 1 0zm0 6a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5z"/>
                </svg>
                <p className="text-xs text-amber-400">
                  {pct >= 90
                    ? "Character limit almost reached. Upgrade to continue."
                    : "You've used 80% of your monthly characters."
                  }
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="h-2 bg-linear-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)] rounded-full"/>
        )}
      </div>
    </div>
  )
}