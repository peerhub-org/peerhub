import { useEffect, useRef } from 'react'

export function useStickyHeaderOffset<T extends HTMLElement>(headerHeight: number) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const updateOffset = () => {
      if (ref.current) {
        const top = Math.max(0, headerHeight - window.scrollY)
        ref.current.style.top = `${top}px`
      }
    }

    updateOffset()
    window.addEventListener('scroll', updateOffset, { passive: true })
    return () => window.removeEventListener('scroll', updateOffset)
  }, [headerHeight])

  return ref
}
