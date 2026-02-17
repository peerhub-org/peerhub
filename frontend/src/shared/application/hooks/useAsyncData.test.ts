import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAsyncData } from './useAsyncData'

describe('useAsyncData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches data on mount', async () => {
    const fetcher = vi.fn().mockResolvedValue(['item1', 'item2'])

    const { result } = renderHook(() => useAsyncData({ fetcher, initialData: [] as string[] }))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(['item1', 'item2'])
    expect(result.current.error).toBeNull()
  })

  it('handles fetch errors', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useAsyncData({ fetcher, initialData: [] as string[] }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual([])
    expect(result.current.error?.message).toBe('Network error')
  })

  it('handles non-Error rejections', async () => {
    const fetcher = vi.fn().mockRejectedValue('string error')

    const { result } = renderHook(() => useAsyncData({ fetcher, initialData: [] as string[] }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error?.message).toBe('An error occurred')
  })

  it('cancels stale requests', async () => {
    let resolveFirst: (value: string[]) => void
    let resolveSecond: (value: string[]) => void

    const fetcher = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<string[]>((r) => {
            resolveFirst = r
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<string[]>((r) => {
            resolveSecond = r
          }),
      )

    const { result } = renderHook(() => useAsyncData({ fetcher, initialData: [] as string[] }))

    // Trigger refetch before first resolves
    await act(async () => {
      result.current.refetch()
    })

    // Resolve second first, then first (stale)
    await act(async () => {
      resolveSecond!(['second'])
    })

    await act(async () => {
      resolveFirst!(['first'])
    })

    expect(result.current.data).toEqual(['second'])
  })

  it('supports manual refetch', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(['initial']).mockResolvedValueOnce(['refetched'])

    const { result } = renderHook(() => useAsyncData({ fetcher, initialData: [] as string[] }))

    await waitFor(() => {
      expect(result.current.data).toEqual(['initial'])
    })

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.data).toEqual(['refetched'])
  })

  it('does not fetch when immediate is false', async () => {
    const fetcher = vi.fn().mockResolvedValue(['data'])

    const { result } = renderHook(() =>
      useAsyncData({ fetcher, initialData: [] as string[], immediate: false }),
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toEqual([])
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('is safe after unmount', async () => {
    let resolve: (value: string[]) => void
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<string[]>((r) => {
          resolve = r
        }),
    )

    const { result, unmount } = renderHook(() =>
      useAsyncData({ fetcher, initialData: [] as string[] }),
    )

    unmount()

    // Resolve after unmount — should not throw
    await act(async () => {
      resolve!(['data'])
    })

    // The state should remain at initial since component unmounted
    expect(result.current.data).toEqual([])
  })
})
