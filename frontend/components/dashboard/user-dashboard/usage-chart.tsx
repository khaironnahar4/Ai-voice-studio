"use client"

interface ChartPoint {
  day:   string
  chars: number
}

export function UsageChart({ data }: { data: ChartPoint[] }) {
  const max     = Math.max(...data.map(d => d.chars), 1)
  const total   = data.reduce((s, d) => s + d.chars, 0)
  const hasData = total > 0

  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-16">
        {data.map((point, i) => {
          const pct = hasData ? (point.chars / max) * 100 : 0
          const isToday = i === data.length - 1

          return (
            <div
              key={point.day}
              className="flex-1 flex flex-col items-center gap-1 group"
            >
              <div className="relative w-full flex items-end" style={{ height: "52px" }}>
                <div
                  className={`w-full rounded-sm transition-all duration-500
                    ${isToday
                      ? "bg-linear-to-t from-[rgb(120,62,246)] to-[rgb(34,211,238)]"
                      : "bg-white/10 group-hover:bg-white/20"
                    }`}
                  style={{ height: `${Math.max(pct, hasData ? 4 : 6)}%` }}
                  title={`${point.day}: ${point.chars.toLocaleString()} chars`}
                />
              </div>
              <span
                className={`text-[9px] font-mono transition-colors
                  ${isToday ? "text-[rgb(167,139,250)]" : "text-white/25"}`}
              >
                {point.day}
              </span>
            </div>
          )
        })}
      </div>

      {/* Total label */}
      {hasData && (
        <p className="text-[11px] text-white/30">
          <span className="text-white/55 font-medium font-mono">
            {total.toLocaleString()}
          </span>
          {" "}chars in the last 7 days
        </p>
      )}
      {!hasData && (
        <p className="text-[11px] text-white/25">No activity in the last 7 days.</p>
      )}
    </div>
  )
}