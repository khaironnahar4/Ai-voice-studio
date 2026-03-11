import Link from 'next/link'
import { Waves, Twitter, Linkedin, Github, MessageCircle } from 'lucide-react'

const FOOTER_LINKS = {
  Product: [
    { label: 'Features',   href: '#features' },
    { label: 'Voices',     href: '#voices' },
    { label: 'Pricing',    href: '#pricing' },
    { label: 'API Docs',   href: '/docs' },
    { label: 'Changelog',  href: '/changelog' },
  ],
  Company: [
    { label: 'About',      href: '/about' },
    { label: 'Blog',       href: '/blog' },
    { label: 'Careers',    href: '/careers' },
    { label: 'Press Kit',  href: '/press' },
    { label: 'Contact',    href: '/contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy',  href: '/cookies' },
    { label: 'GDPR',           href: '/gdpr' },
  ],
} as const

const SOCIAL = [
  { label: 'Twitter / X', icon: Twitter,        href: 'https://twitter.com/vocera' },
  { label: 'LinkedIn',    icon: Linkedin,        href: 'https://linkedin.com/company/vocera' },
  { label: 'GitHub',      icon: Github,          href: 'https://github.com/vocera' },
  { label: 'Discord',     icon: MessageCircle,   href: 'https://discord.gg/vocera' },
] as const

export default function Footer() {
  return (
    <footer className="relative bg-vocera-card/80 border-t border-white/6" role="contentinfo">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12 py-16">

          {/* Brand column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-2 group w-fit" aria-label="Vocera homepage">
              <Waves className="w-7 h-7 text-vocera-purple group-hover:scale-110 transition-transform duration-300" />
              <span className="font-display font-bold text-xl text-white">
                Voce<span className="text-gradient">ra</span>
              </span>
            </Link>
            <p className="text-vocera-muted text-sm leading-relaxed max-w-xs">
              The AI voice platform for creators, developers, and enterprises. Convert text to lifelike speech in seconds.
            </p>
            {/* Social icons */}
            <div className="flex gap-3">
              {SOCIAL.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/6 text-vocera-muted hover:text-white hover:bg-vocera-purple/20 hover:border-vocera-purple/30 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav link columns */}
          {(Object.entries(FOOTER_LINKS) as [string, readonly { label: string; href: string }[]][]).map(([group, links]) => (
            <div key={group}>
              <h3 className="font-semibold text-xs uppercase tracking-widest text-vocera-subtle mb-5">
                {group}
              </h3>
              <ul className="flex flex-col gap-3" role="list">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-vocera-muted hover:text-white transition-colors duration-150"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter strip */}
        <div className="border-t border-white/6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-semibold text-white text-sm mb-0.5">Stay in the loop</p>
              <p className="text-vocera-subtle text-xs">New voices, features, and updates — no spam.</p>
            </div>
            <form
              className="flex gap-2 w-full sm:w-auto"
              onSubmit={(e) => e.preventDefault()}
              aria-label="Newsletter signup"
            >
              <input
                type="email"
                placeholder="you@example.com"
                required
                className="flex-1 sm:w-64 bg-black/30 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-vocera-subtle focus:outline-none focus:ring-2 focus:ring-vocera-purple/50 transition-all"
                aria-label="Email address for newsletter"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-vocera-purple hover:bg-vocera-violet text-white font-semibold text-sm transition-all duration-200 shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-vocera-subtle">
          <span>© {new Date().getFullYear()} Vocera AI, Inc. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Made with ♥ for creators everywhere</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
