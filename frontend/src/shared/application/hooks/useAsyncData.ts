import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAsyncDataOptions<T> {
  fetcher: () => Promise<T>
  initialData: T
  immediate?: boolean
}

interface UseAsyncDataResult<T> {
  data: T
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useAsyncData<T>({
  fetcher,
  initialData,
  immediate = true,
}: UseAsyncDataOptions<T>): UseAsyncDataResult<T> {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState<Error | null>(null)
  const isMountedRef = useRef(true)
  const requestIdRef = useRef(0)

  const execute = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (!isMountedRef.current || requestId !== requestIdRef.current) return
      setData(result)
    } catch (err: unknown) {
      if (!isMountedRef.current || requestId !== requestIdRef.current) return
      setData(initialData)
      setError(err instanceof Error ? err : new Error('An error occurred'))
    } finally {
      if (isMountedRef.current && requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher])

  useEffect(() => {
    isMountedRef.current = true
    if (immediate) {
      execute()
    }
    return () => {
      isMountedRef.current = false
    }
  }, [execute, immediate])

  return { data, loading, error, refetch: execute }
}
