import { useState, useEffect } from 'react'

const VERSION_URL = 'https://raw.githubusercontent.com/peerhub-org/peerhub/refs/heads/main/VERSION'

let cached: string | null = null

export function useVersion(fallback = '') {
  const [version, setVersion] = useState(cached ?? fallback)

  useEffect(() => {
    if (cached) return

    fetch(VERSION_URL)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((text) => {
        const v = text.trim()
        cached = v
        setVersion(v)
      })
      .catch(() => {})
  }, [])

  return version
}
