'use client'

import { useEffect } from 'react'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenis: InstanceType<typeof import('lenis').default> | null = null

    const initLenis = async () => {
      const LenisModule = await import('lenis')
      const Lenis = LenisModule.default

      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
      })

      const raf = (time: number) => {
        lenis!.raf(time)
        requestAnimationFrame(raf)
      }

      requestAnimationFrame(raf)
    }

    // Respect reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mq.matches) {
      initLenis()
    }

    return () => {
      if (lenis) lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
