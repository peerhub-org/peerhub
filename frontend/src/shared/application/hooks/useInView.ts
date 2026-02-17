import { useState, useCallback } from 'react'

export function useInView(threshold = 0.1): [React.RefCallback<HTMLDivElement>, boolean] {
  const [isVisible, setIsVisible] = useState(false)

  const callbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.disconnect()
          }
        },
        { threshold },
      )
      observer.observe(node)
    },
    [threshold],
  )

  return [callbackRef, isVisible]
}
