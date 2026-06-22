import WaveBars from "./WaveBars"

const CODE_SNIPPET = `const vocera = require('vocera-sdk')

const audio = await vocera.synthesize({
  text: "Hello from Vocera!",
  voice: "aria-us-en",
  format: "mp3",
})`

interface Feature {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  desc: string;
  stat: string;
  accent?: boolean;
  size?: 'lg' | 'sm';
  code?: boolean;
}

export default function FeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon, title, desc, stat, accent, size } = feature
  const hasCode = 'code' in feature && feature.code

  return (
    <article
      className={[
        'revealed transition-all duration-[1.2s] ease-out delay-500',
        'relative glass-card rounded-2xl p-6 overflow-hidden',
        'hover:border-vocera-purple hover:glow-purple-sm transition-all duration-700',
        'group cursor-default',
        size === 'lg' ? 'md:col-span-2' : '',
        accent ? 'border-vocera-purple/50 bg-vocera-card' : '',
      ].join(' ')}
    >
      {/* Background glow for accent card */}
      {accent && (
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-20 w-60 h-60 bg-vocera-purple/15 rounded-full blur-3xl pointer-events-none"
        />
      )}

      <div className={['flex gap-6', size === 'lg' ? 'flex-col sm:flex-row' : 'flex-col'].join(' ')}>
        {/* Icon & stat */}
        <div className="shrink-0">
          <div className="w-12 h-12 rounded-xl bg-vocera-purple/15 flex items-center justify-center mb-4 group-hover:bg-vocera-purple/50 transition-colors duration-300">
            <Icon className="w-5 h-5 text-vocera-violet" strokeWidth={2} />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-vocera-violet bg-vocera-purple/15 border border-vocera-purple/20">
            {stat}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1">
          <h3 className="font-display font-bold text-lg text-white mb-2 leading-snug">
            {title}
          </h3>
          <p className="text-vocera-muted text-sm leading-relaxed">{desc}</p>

          {/* Visual decoration per card type */}
          <div className="mt-5">
            {title === 'Lifelike AI Voices' && (
              <WaveBars count={20} />
            )}
            {hasCode && (
              <div className="rounded-xl bg-black/40 border border-white/8 p-4 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto">
                <pre>{CODE_SNIPPET}</pre>
              </div>
            )}
            {title === 'Emotion & Tone Control' && (
              <div className="space-y-2.5 mt-1">
                {(['Speed', 'Pitch', 'Emotion'] as const).map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-[11px] text-vocera-subtle w-14 shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-vocera-purple to-vocera-violet rounded-full"
                        style={{ width: `${45 + i * 18}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}