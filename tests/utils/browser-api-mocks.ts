/**
 * Browser API mocks for testing
 * 
 * These mocks are required for components that use:
 * - matchMedia (responsive breakpoints)
 * - ResizeObserver (component resize detection)
 * - PointerEvent (pointer type detection)
 * - IntersectionObserver (visibility/lazy loading)
 */

import { vi } from 'vitest'

/**
 * Mock matchMedia for viewport testing
 * @param viewportWidth - Width in pixels to simulate
 * @returns Mock matchMedia implementation
 */
export function mockMatchMedia(viewportWidth: number) {
  return vi.fn((query: string) => {
    const matches = query.includes('max-width')
      ? viewportWidth <= parseInt(query.match(/\d+/)?.[0] || '0')
      : viewportWidth >= parseInt(query.match(/\d+/)?.[0] || '0')

    return {
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
  })
}

/**
 * Mock ResizeObserver with callback support
 * @returns Mock ResizeObserver implementation
 */
export function mockResizeObserver() {
  const callbacks: ResizeObserverCallback[] = []

  const ResizeObserverMock = vi.fn((callback: ResizeObserverCallback) => {
    callbacks.push(callback)
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }
  }) as unknown as typeof ResizeObserver

  // Helper to trigger resize callbacks
  ;(ResizeObserverMock as any).trigger = (entries: ResizeObserverEntry[]) => {
    callbacks.forEach((callback) => {
      callback(entries, ResizeObserverMock as any)
    })
  }

  return ResizeObserverMock
}

/**
 * Mock PointerEvent with pointer type support
 * @param pointerType - 'mouse' | 'touch' | 'pen'
 * @returns Mock PointerEvent implementation
 */
export function mockPointerEvent(pointerType: 'mouse' | 'touch' | 'pen' = 'mouse') {
  class PointerEventMock extends Event {
    pointerType: string
    clientX: number
    clientY: number
    buttons: number

    constructor(type: string, init?: PointerEventInit) {
      super(type, init)
      this.pointerType = init?.pointerType || pointerType
      this.clientX = init?.clientX || 0
      this.clientY = init?.clientY || 0
      this.buttons = init?.buttons || 0
    }
  }

  return PointerEventMock as typeof PointerEvent
}

/**
 * Mock IntersectionObserver with callback support
 * @returns Mock IntersectionObserver implementation
 */
export function mockIntersectionObserver() {
  const callbacks: IntersectionObserverCallback[] = []

  const IntersectionObserverMock = vi.fn(
    (callback: IntersectionObserverCallback) => {
      callbacks.push(callback)
      return {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        root: null,
        rootMargin: '',
        thresholds: [],
      }
    }
  ) as unknown as typeof IntersectionObserver

  // Helper to trigger intersection callbacks
  ;(IntersectionObserverMock as any).trigger = (
    entries: IntersectionObserverEntry[]
  ) => {
    callbacks.forEach((callback) => {
      callback(entries, IntersectionObserverMock as any)
    })
  }

  return IntersectionObserverMock
}

/**
 * Initialize all browser API mocks with default values
 */
export function setupBrowserMocks() {
  // matchMedia is already partially mocked in setup.ts, but we enhance it here
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia(1920), // Default to desktop wide
    })
  }

  // ResizeObserver
  if (!window.ResizeObserver) {
    ;(window as any).ResizeObserver = mockResizeObserver()
  }

  // PointerEvent (if not available)
  if (!window.PointerEvent) {
    ;(window as any).PointerEvent = mockPointerEvent('mouse')
  }

  // IntersectionObserver
  if (!window.IntersectionObserver) {
    ;(window as any).IntersectionObserver = mockIntersectionObserver()
  }
}
