'use client'

import { useEffect } from 'react'

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

     if (isMobile || prefersReduced) return

    let lenis: InstanceType<typeof import('lenis').default> | null = null
    let rafId: number

    const initLenis = async () => {

      const LenisModule = await import('lenis')
      const Lenis = LenisModule.default

      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })

      const raf = (time: number) => {
        lenis!.raf(time)
        rafId = requestAnimationFrame(raf)
      }

      rafId = requestAnimationFrame(raf)
    }

    initLenis()

  

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (lenis) lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
