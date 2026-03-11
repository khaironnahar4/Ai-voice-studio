'use client'

import { useRef, useEffect } from 'react'

/**
 * Lightweight scroll reveal using IntersectionObserver.
 * Falls back gracefully without GSAP — elements animate via CSS classes.
 * For full GSAP, import useGSAP directly in components that need it.
 */
export function useScrollReveal(selector = '.reveal') {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return

    const elements = containerRef.current?.querySelectorAll<HTMLElement>(selector) ?? []

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [selector])

  return containerRef
}
