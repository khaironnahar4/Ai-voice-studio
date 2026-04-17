import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center
                    justify-center px-4 text-center">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-100 h-75 rounded-full
                      bg-[rgba(120,62,246,0.06)] blur-[100px] pointer-events-none"/>

      <div className="relative">
        {/* 404 number */}
        <p className="text-[120px] md:text-[160px] font-bold leading-none
                      bg-linear-to-b from-white/10 to-transparent
                      bg-clip-text text-transparent select-none mb-4">
          404
        </p>

        {/* Waveform decoration */}
        <div className="flex items-center justify-center gap-0.75 h-8 mb-6 opacity-40">
          {Array.from({ length: 20 }).map((_, i) => (
            <span
              key={i}
              className="w-0.75 rounded-full bg-linear-to-t
                         from-[rgb(120,62,246)] to-[rgb(34,211,238)]"
              style={{ height: `${8 + Math.sin(i * 0.6) * 14}px` }}
            />
          ))}
        </div>

        <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-white/40 mb-8 max-w-xs mx-auto leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2
                       px-6 py-2.5 rounded-xl bg-[rgb(120,62,246)] text-white
                       text-sm font-medium hover:bg-[rgba(120,62,246,0.85)]
                       transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2
                       px-6 py-2.5 rounded-xl border border-[#282846]
                       text-white/55 text-sm font-medium
                       hover:text-white hover:border-white/25
                       transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}