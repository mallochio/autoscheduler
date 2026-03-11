import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from '../hooks/use-mobile'

describe('useIsMobile', () => {
  let listeners: Record<string, Function[]> = {}

  beforeEach(() => {
    listeners = {}
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, fn: Function) => {
          listeners[event] = listeners[event] || []
          listeners[event].push(fn)
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('returns false on desktop (window.innerWidth >= 768)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true on mobile (window.innerWidth < 768)', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('responds to resize via matchMedia change event', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 })
      listeners['change']?.forEach(fn => fn())
    })
    expect(result.current).toBe(true)
  })
})
