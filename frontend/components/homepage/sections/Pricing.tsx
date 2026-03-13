'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Zap } from 'lucide-react'
import { useScrollReveal } from '@/utils/useScrollReveal'

const PLANS = [
  {
    name:       'Free',
    monthly:    0,
    annual:     0,
    desc:       'Perfect for exploring Vocera and personal projects.',
    badge:      null,
    highlight:  false,
    cta:        'Get Started',
    ctaHref:    '/sign-up',
    features: [
      '10,000 characters / month',
      '20 standard voices',
      '5 supported languages',
      'MP3 export only',
      '3 projects',
      'Community support',
    ],
  },
  {
    name:       'Pro',
    monthly:    19,
    annual:     15,
    desc:       'For creators, developers, and growing teams.',
    badge:      'Most Popular',
    highlight:  true,
    cta:        'Start Pro Free',
    ctaHref:    '/sign-up?plan=pro',
    features: [
      '1,000,000 characters / month',
      '200+ premium voices',
      '50+ languages & accents',
      'MP3, WAV, OGG, FLAC export',
      'Unlimited projects',
      'API access & SDK',
      'Custom pronunciation guide',
      'Email support (24h)',
    ],
  },
  {
    name:       'Enterprise',
    monthly:    null,
    annual:     null,
    desc:       'Unlimited scale, dedicated infra, and white-glove support.',
    badge:      null,
    highlight:  false,
    cta:        'Contact Sales',
    ctaHref:    '/contact',
    features: [
      'Unlimited characters',
      'All voices + custom voice clone',
      'All languages + regional variants',
      'All formats + batch processing',
      'Unlimited projects & workspaces',
      'Priority REST API + webhooks',
      'SLA 99.99% uptime guarantee',
      'Dedicated Customer Success Manager',
      'SOC 2 + GDPR compliance docs',
      'On-premise deployment option',
    ],
  },
] as const

export default function Pricing() {
  const containerRef = useScrollReveal('.reveal')
  const [annual, setAnnual] = useState(false)

  return (
    <section
      id="pricing"
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative py-12 lg:py-16"
      aria-labelledby="pricing-heading"
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-175 h-75 bg-vocera-purple/8 rounded-full blur-[100px] pointer-events-none"
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out inline-block text-xs font-bold uppercase tracking-widest text-vocera-violet mb-4">
            Pricing
          </span>
          <h2
            id="pricing-heading"
            className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out font-display font-extrabold text-4xl sm:text-5xl text-white leading-tight"
          >
            Simple, Transparent{' '}
            <span className="text-gradient">Pricing</span>
          </h2>
          <p className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out mt-4 text-vocera-muted text-lg max-w-lg mx-auto">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>

          {/* Billing toggle */}
          <div className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out flex items-center justify-center gap-3 mt-8">
            <span className={['text-sm font-medium', !annual ? 'text-white' : 'text-vocera-subtle'].join(' ')}>
              Monthly
            </span>
            <button
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual((a) => !a)}
              className={[
                'relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-300',
                annual ? 'bg-vocera-purple' : 'bg-white/15',
              ].join(' ')}
              aria-label="Toggle annual billing"
            >
              <span
                className={[
                  'absolute inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300',
                  annual ? 'translate-x-7' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
            <span className={['text-sm font-medium flex items-center gap-2', annual ? 'text-white' : 'text-vocera-subtle'].join(' ')}>
              Annual
              {annual && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30">
                  Save 20%
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {PLANS.map((plan, i) => (
            <article
              key={plan.name}
              className={[
                'reveal opacity-0 translate-y-8 transition-all duration-700 ease-out',
                'relative rounded-2xl p-7 flex flex-col gap-6 transition-all duration-300',
                plan.highlight
                  ? 'bg-vocera-purple/10 border-2 border-vocera-purple/60 shadow-glow scale-[1.03]'
                  : 'glass-card hover:border-vocera-purple/25',
              ].join(' ')}
              style={{ transitionDelay: `${i * 80}ms` }}
              aria-label={`${plan.name} plan`}
            >
              {/* Popular badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-vocera-purple text-white text-[11px] font-bold uppercase tracking-widest shadow-glow-sm">
                    <Zap className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div>
                <h3 className="font-display font-bold text-xl text-white mb-1">{plan.name}</h3>
                <p className="text-vocera-muted text-sm leading-relaxed">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="flex items-end gap-2">
                {plan.monthly === null ? (
                  <span className="font-display font-extrabold text-4xl text-white">Custom</span>
                ) : (
                  <>
                    <span className="font-display font-extrabold text-5xl text-white leading-none">
                      ${annual ? plan.annual : plan.monthly}
                    </span>
                    <span className="text-vocera-muted text-sm mb-1.5 font-medium">/month</span>
                  </>
                )}
              </div>
              {plan.monthly !== null && plan.monthly !== 0 && annual && (
                <p className="text-xs text-vocera-subtle -mt-4">
                  Billed as ${(plan.annual as number) * 12}/year
                </p>
              )}

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={[
                  'flex items-center justify-center py-3.5 rounded-xl font-bold text-sm transition-all duration-200',
                  plan.highlight
                    ? 'bg-vocera-purple hover:bg-vocera-violet text-white glow-purple hover:scale-[1.02] active:scale-[0.98]'
                    : 'border border-white/12 text-white hover:bg-white/6 hover:border-white/20',
                ].join(' ')}
              >
                {plan.cta}
              </Link>

              {/* Divider */}
              <div className="h-px bg-white/6" />

              {/* Features list */}
              <ul className="flex flex-col gap-3" role="list">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-vocera-muted">
                    <Check className="w-4 h-4 text-vocera-violet shrink-0 mt-0.5" strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Footer note */}
        <p className="reveal opacity-0 translate-y-8 transition-all duration-700 ease-out text-center mx-auto text-xs text-vocera-subtle mt-8">
          All plans include a 14-day free trial on paid features. No credit card required to start.
        </p>
      </div>

      <style>{`.revealed { opacity: 1 !important; transform: translateY(0) !important; }`}</style>
    </section>
  )
}
