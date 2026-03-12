'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { useScrollReveal } from '@/utils/useScrollReveal'

const FAQS = [
  {
    q: 'Is Vocera free to use?',
    a: 'Yes — Vocera has a generous free tier with 10,000 characters per month, access to 20 standard voices, and MP3 export. No credit card required. You can upgrade to Pro anytime for access to 200+ premium voices, 1M characters/month, and the full API.',
  },
  {
    q: 'How realistic are the AI voices?',
    a: "Vocera's voices are trained on thousands of hours of real human speech using the latest neural TTS models. Most users find them indistinguishable from human recordings in a blind test. You can preview any voice before committing.",
  },
  {
    q: 'What languages and accents are supported?',
    a: 'Vocera supports 50+ languages including English (US, British, Australian, Indian), Spanish, French, German, Japanese, Mandarin, Arabic, Hindi, Portuguese, and many more — each with multiple regional accent options.',
  },
  {
    q: 'Can I use Vocera-generated audio commercially?',
    a: 'Absolutely. Pro and Enterprise plans include full commercial usage rights for any audio you generate. Free plan audio is licensed for personal, non-commercial use only. See our Terms of Service for complete details.',
  },
  {
    q: 'Does Vocera offer an API for developers?',
    a: 'Yes. Pro and Enterprise plans include REST API access with official SDKs for Node.js, Python, Go, and Ruby. The API supports streaming audio, batch processing, SSML, custom phonemes, and webhook callbacks.',
  },
  {
    q: 'What audio formats does Vocera support?',
    a: 'Free tier exports MP3 only. Pro and Enterprise plans support MP3, WAV, OGG, FLAC, and PCM. You can configure bitrate, sample rate, and channel settings via the API or dashboard.',
  },
  {
    q: 'How does Vocera handle my data and privacy?',
    a: 'Vocera is SOC 2 Type II certified and GDPR compliant. Your text inputs and generated audio are encrypted in transit (TLS 1.3) and at rest (AES-256). We never use your content to train AI models. Enterprise plans support data residency agreements.',
  },
  {
    q: 'Can I create a custom voice clone?',
    a: 'Custom voice cloning is available on the Enterprise plan. You provide a minimum of 30 minutes of clean audio in your target voice, and our team trains a private model available exclusively to your organization. Contact our sales team for details.',
  },
] as const

export default function FAQ() {
  // const containerRef = useScrollReveal('.reveal')
  const [openIndex, setOpen] = useState<number | null>(0)

  return (
    <section
      id="faq"
      // ref={containerRef as React.RefObject<HTMLDivElement>}
      className="relative py-12 lg:py-16"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14">
          <span className="reveala opacity-100 translate-y-8 transition-all duration-700 ease-out inline-block text-xs font-bold uppercase tracking-widest text-vocera-violet mb-4">
            FAQ
          </span>
          <h2
            id="faq-heading"
            className="reveala opacity-100 translate-y-8 transition-all duration-700 ease-out font-display font-extrabold text-4xl sm:text-5xl text-white leading-tight"
          >
            Common Questions,{' '}
            <span className="text-gradient">Honest Answers</span>
          </h2>
        </div>

        {/* Accordion */}
        <dl className="flex flex-col gap-3">
          {FAQS.map(({ q, a }, i) => {
            const isOpen = openIndex === i
            return (
              <div
                key={q}
                className={[
                  'reveala opacity-100 translate-y-8 transition-all duration-700 ease-out',
                  'glass-card rounded-2xl overflow-hidden',
                  isOpen ? 'border-vocera-purple/30' : '',
                ].join(' ')}
                style={{ transitionDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                <dt>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${i}`}
                    id={`faq-question-${i}`}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left group"
                  >
                    <span className={[
                      'font-semibold text-base leading-snug transition-colors duration-200',
                      isOpen ? 'text-white' : 'text-vocera-muted group-hover:text-white',
                    ].join(' ')}>
                      {q}
                    </span>
                    <span className={[
                      'shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300',
                      isOpen
                        ? 'bg-vocera-purple text-white rotate-0'
                        : 'bg-white/6 text-vocera-subtle group-hover:bg-white/10 group-hover:text-vocera-muted',
                    ].join(' ')}>
                      {isOpen
                        ? <Minus className="w-3.5 h-3.5" />
                        : <Plus  className="w-3.5 h-3.5" />
                      }
                    </span>
                  </button>
                </dt>

                <dd
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  className={[
                    'overflow-hidden transition-all duration-300 ease-out',
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-100',
                  ].join(' ')}
                >
                  <p className="px-6 pb-6 text-sm text-vocera-muted leading-relaxed">
                    {a}
                  </p>
                </dd>
              </div>
            )
          })}
        </dl>

        {/* Bottom CTA */}
        <div className="reveala opacity-100 translate-y-8 transition-all duration-700 ease-out text-center mt-12">
          <p className="text-vocera-muted text-sm mb-4">Still have questions?</p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 text-vocera-violet font-semibold text-sm hover:underline"
          >
            Contact our support team →
          </a>
        </div>
      </div>

      <style>{`.revealed { opacity: 1 !important; transform: translateY(0) !important; }`}</style>
    </section>
  )
}
