import Link                from "next/link"
import { requireSession }  from "@/lib/auth/session"
import { getDashboardData } from "@/lib/dashboard/queries"
import { RecentList }      from "@/components/dashboard/user-dashboard/recent-list"
import { UsageChart }      from "@/components/dashboard/user-dashboard/usage-chart"
import {
  Mic2, History, CreditCard,
  TrendingUp, Files, Zap,
} from "lucide-react"

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, accent = false,
}: {
  label:   string
  value:   string | number
  sub?:    string
  icon:    React.ElementType
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 md:p-5 flex flex-col gap-3
        ${accent
          ? "bg-[rgba(120,62,246,0.08)] border-[rgba(120,62,246,0.25)]"
          : "bg-[#141424] border-[#282846]"
        }`}
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center
          ${accent
            ? "bg-[rgba(120,62,246,0.2)]"
            : "bg-white/6"
          }`}
      >
        <Icon
          className={`w-4 h-4
            ${accent ? "text-[rgb(120,62,246)]" : "text-white/40"}`}
        />
      </div>
      <div>
        <p className="text-2xl font-semibold text-white tabular-nums tracking-tight">
          {value}
        </p>
        <p className="text-xs text-white/40 mt-0.5">{label}</p>
        {sub && (
          <p className="text-[11px] text-white/25 mt-0.5">{sub}</p>
        )}
      </div>
    </div>
  )
}

// ── Greeting ───────────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const { user }   = await requireSession()
  const data       = await getDashboardData(user.id)

  const firstName  = user.name?.split(" ")[0] ?? "there"
  const charPctColor =
    data.usage.charPct > 90 ? "bg-red-500"    :
    data.usage.charPct > 70 ? "bg-amber-500"  :
    "bg-gradient-to-r from-[rgb(120,62,246)] to-[rgb(34,211,238)]"

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
            {getGreeting()}, {firstName}.
          </h2>
          <p className="text-sm text-white/35 mt-1">
            Here&apos;s what&apos;s happening with your Vocera AI account.
          </p>
        </div>

        {/* Quick action */}
        <Link
          href="/studio"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-[rgb(120,62,246)] hover:bg-[rgba(120,62,246,0.85)]
                     text-white text-sm font-medium shrink-0
                     transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Mic2 className="w-4 h-4" />
          New generation
        </Link>
      </div>

      {/* ── Stats grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Total generations"
          value={data.stats.totalRequests.toLocaleString()}
          sub={`${data.stats.todayRequests} today`}
          icon={Mic2}
          accent
        />
        <StatCard
          label="Audio files"
          value={data.stats.audioFiles.toLocaleString()}
          sub={`${data.stats.storageMb} MB stored`}
          icon={Files}
        />
        <StatCard
          label="Chars this month"
          value={data.usage.charUsed.toLocaleString()}
          sub={`${data.usage.charPct}% of limit`}
          icon={TrendingUp}
        />
        <StatCard
          label="Active plan"
          value={data.plan?.name ?? "Free"}
          sub={data.subscription?.status === "trialing" ? "Trial active" : undefined}
          icon={Zap}
        />
      </div>

      {/* ── Two-column section ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left: Usage card (3/5) */}
        <div className="lg:col-span-3 rounded-xl border border-[#282846]
                        bg-[#141424] p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white/80">
                Character usage
              </h3>
              <p className="text-xs text-white/35 mt-0.5">
                Current billing period
              </p>
            </div>
            <Link
              href="/billing"
              className="text-xs text-[rgb(167,139,250)] hover:text-[rgb(120,62,246)]
                         transition-colors"
            >
              {data.plan?.name === "Free" ? "Upgrade →" : "Manage →"}
            </Link>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-white/40 font-mono">
                {data.usage.charUsed.toLocaleString()} used
              </span>
              <span className="text-white/25 font-mono">
                {data.usage.charLimit.toLocaleString()} limit
              </span>
            </div>
            <div className="h-2 bg-[#282846] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${charPctColor}`}
                style={{ width: `${data.usage.charPct}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-white/20">0</span>
              <span
                className={`text-[11px] font-medium
                  ${data.usage.charPct > 90 ? "text-red-400"  :
                    data.usage.charPct > 70 ? "text-amber-400" :
                    "text-white/40"}`}
              >
                {data.usage.charPct}% used
              </span>
            </div>
          </div>

          {/* 7-day chart */}
          <div>
            <p className="text-xs text-white/35 mb-3">Last 7 days</p>
            <UsageChart data={data.chartData} />
          </div>
        </div>

        {/* Right: Recent generations (2/5) */}
        <div className="lg:col-span-2 rounded-xl border border-[#282846]
                        bg-[#141424] p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/80">
              Recent generations
            </h3>
            <Link
              href="/history"
              className="text-xs text-white/35 hover:text-white/60
                         transition-colors flex items-center gap-1"
            >
              View all
              <History className="w-3 h-3" />
            </Link>
          </div>

          <RecentList
            items={data.recentGenerations.map(r => ({
              id:         r.id,
              inputText:  r.inputText,
              charCount:  r.charCount,
              createdAt:  r.createdAt.toISOString(),
              voiceModel: r.voiceModel,
              audioFile:  r.audioFile
                ? {
                    ...r.audioFile,
                    durationSeconds: r.audioFile.durationSeconds
                      ? Number(r.audioFile.durationSeconds)
                      : null,
                  }
                : null,
            }))}
          />
        </div>

      </div>

      {/* ── Quick actions row ─────────────────────────────────────── */}
      <div>
        <h3 className="text-xs text-white/35 uppercase tracking-widest mb-3">
          Quick actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              href:    "/studio",
              icon:    Mic2,
              label:   "Open Studio",
              sub:     "Convert text to speech",
              color:   "text-[rgb(120,62,246)]",
              bg:      "bg-[rgba(120,62,246,0.08)] border-[rgba(120,62,246,0.2)]",
            },
            {
              href:    "/history",
              icon:    History,
              label:   "View History",
              sub:     "Browse past generations",
              color:   "text-teal-400",
              bg:      "bg-teal-500/5 border-teal-500/15",
            },
            {
              href:    "/billing",
              icon:    CreditCard,
              label:   data.plan?.name === "Free" ? "Upgrade plan" : "Manage billing",
              sub:     data.plan?.name === "Free"
                         ? "Unlock more characters"
                         : "View invoices & usage",
              color:   "text-amber-400",
              bg:      "bg-amber-500/5 border-amber-500/15",
            },
          ].map(action => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 p-4 rounded-xl border
                         ${action.bg}
                         hover:brightness-125 transition-all duration-150
                         group`}
            >
              <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center
                              justify-center shrink-0`}>
                <action.icon className={`w-4 h-4 ${action.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80
                              group-hover:text-white transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-white/30 truncate">{action.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}