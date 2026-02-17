import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInView } from './useInView'

describe('useInView', () => {
  let observeMock: ReturnType<typeof vi.fn>
  let disconnectMock: ReturnType<typeof vi.fn>
  let observerCallback: (entries: Partial<IntersectionObserverEntry>[]) => void

  beforeEach(() => {
    observeMock = vi.fn()
    disconnectMock = vi.fn()

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
          observerCallback = callback
        }
        observe = observeMock
        disconnect = disconnectMock
        unobserve = vi.fn()
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns false initially', () => {
    const { result } = renderHook(() => useInView())
    const [, isVisible] = result.current
    expect(isVisible).toBe(false)
  })

  it('becomes visible when element intersects', () => {
    const { result } = renderHook(() => useInView())

    const node = document.createElement('div')
    act(() => {
      result.current[0](node)
    })

    expect(observeMock).toHaveBeenCalledWith(node)

    act(() => {
      observerCallback([{ isIntersecting: true }])
    })

    expect(result.current[1]).toBe(true)
    expect(disconnectMock).toHaveBeenCalled()
  })

  it('does not observe null nodes', () => {
    const { result } = renderHook(() => useInView())

    act(() => {
      result.current[0](null)
    })

    expect(observeMock).not.toHaveBeenCalled()
  })

  it('stays false when not intersecting', () => {
    const { result } = renderHook(() => useInView())

    const node = document.createElement('div')
    act(() => {
      result.current[0](node)
    })

    act(() => {
      observerCallback([{ isIntersecting: false }])
    })

    expect(result.current[1]).toBe(false)
  })
})
