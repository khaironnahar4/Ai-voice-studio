// components/marketing/skeletons.tsx
// Use these while home page sections load

// ── Hero skeleton ─────────────────────────────────────────────────────────
export function HeroSkeleton() {
  return (
    <section className="relative flex flex-col items-center justify-center
                        min-h-screen px-4 text-center overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-6 w-full">
        {/* Badge */}
        <div className="flex justify-center">
          <div className="h-7 w-48 rounded-full skeleton"/>
        </div>
        {/* Headline */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="h-14 w-[80%] rounded-xl skeleton"/>
          <div className="h-14 w-[60%] rounded-xl skeleton"/>
        </div>
        {/* Subtext */}
        <div className="space-y-2 flex flex-col items-center">
          <div className="h-5 w-[55%] rounded skeleton"/>
          <div className="h-5 w-[40%] rounded skeleton"/>
        </div>
        {/* CTA buttons */}
        <div className="flex gap-3 justify-center">
          <div className="h-12 w-36 rounded-xl skeleton"/>
          <div className="h-12 w-36 rounded-xl skeleton"/>
        </div>
        {/* Waveform */}
        <div className="flex items-center justify-center gap-0.75 h-16 pt-4">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className="w-0.75 rounded-full skeleton"
                  style={{ height: `${16 + Math.sin(i * 0.4) * 20}px` }}/>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Voice samples skeleton ────────────────────────────────────────────────
export function VoiceSamplesSkeleton() {
  return (
    <section className="py-20 md:py-28 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 space-y-3">
          <div className="h-3 w-36 rounded-full skeleton mx-auto"/>
          <div className="h-10 w-80 rounded-xl skeleton mx-auto"/>
          <div className="h-10 w-64 rounded-xl skeleton mx-auto"/>
          <div className="space-y-2">
            <div className="h-4 w-96 rounded skeleton mx-auto"/>
            <div className="h-4 w-72 rounded skeleton mx-auto"/>
          </div>
          {/* Filter pills */}
          <div className="flex gap-2 justify-center pt-2">
            {[80, 96, 104].map(w => (
              <div key={w} className="h-7 rounded-full skeleton"
                   style={{ width: `${w}px` }}/>
            ))}
          </div>
        </div>

        {/* Voice grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2
                        lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <VoiceCardSkeleton key={i}/>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10 space-y-3">
          <div className="h-4 w-56 rounded skeleton mx-auto"/>
          <div className="h-11 w-36 rounded-xl skeleton mx-auto"/>
        </div>
      </div>
    </section>
  )
}

function VoiceCardSkeleton() {
  return (
    <div className="rounded-xl border border-[#282846] bg-[#141424] p-4">
      <div className="flex items-start gap-2 mb-3 pl-1">
        <div className="h-5 w-10 rounded skeleton"/>
        <div className="h-5 w-20 rounded skeleton"/>
      </div>
      <div className="space-y-1.5 mb-4">
        <div className="h-3.5 w-full rounded skeleton"/>
        <div className="h-3.5 w-3/4 rounded skeleton"/>
      </div>
      <div className="flex gap-1.5 mb-4">
        {[48, 56, 44].map(w => (
          <div key={w} className="h-4 rounded-full skeleton"
               style={{ width: `${w}px` }}/>
        ))}
      </div>
      <div className="h-8 w-20 rounded-lg skeleton"/>
    </div>
  )
}

// ── Full home page skeleton (compose above) ───────────────────────────────
export function HomePageSkeleton() {
  return (
    <div className="bg-[#0F0F1A]">
      <HeroSkeleton />
      <VoiceSamplesSkeleton />
    </div>
  )
}