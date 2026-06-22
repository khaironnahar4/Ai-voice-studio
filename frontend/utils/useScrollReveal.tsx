'use client'

import { useRef, useEffect } from 'react'

export function useScrollReveal(selector = '.reveal') {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    if (mq.matches) {
      const elements = containerRef.current?.querySelectorAll<HTMLElement>(selector) ?? []
      elements.forEach((el) => el.classList.add('revealed'))
      return
    }

    const isMobile = window.innerWidth < 768

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
      {
        threshold: 0,
        // Mobile এ negative rootMargin সরিয়ে দাও
        rootMargin: isMobile ? '0px' : '0px 0px -60px 0px',
      }
    )

    elements.forEach((el) => observer.observe(el))

    // Safety fallback: 3 সেকেন্ড পরেও যে elements reveal হয়নি, force reveal করো
    const fallbackTimer = setTimeout(() => {
      elements.forEach((el) => {
        if (!el.classList.contains('revealed')) {
          el.classList.add('revealed')
        }
      })
    }, 3000)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [selector])

  return containerRef
}