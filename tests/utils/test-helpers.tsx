/**
 * Test helpers and utilities
 */

import { render, type RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import type { Task, TimeHorizon } from '@/lib/types'
import { mockMatchMedia } from './browser-api-mocks'

// Viewport presets
export const VIEWPORT_PRESETS = {
  DESKTOP_WIDE: { width: 1920, height: 1080 },
  DESKTOP_NARROW: { width: 768, height: 1024 },
  MOBILE: { width: 375, height: 667 },
} as const

/**
 * Task factory function for creating test tasks
 */
export function createTestTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString()
  return {
    id: overrides.id || `test-task-${Date.now()}-${Math.random()}`,
    user_id: overrides.user_id || 'test-user-id',
    title: overrides.title || 'Test Task',
    description: overrides.description || null,
    time_horizon: overrides.time_horizon || 'now',
    completed: overrides.completed ?? false,
    completed_at: overrides.completed_at || null,
    created_at: overrides.created_at || now,
    updated_at: overrides.updated_at || now,
    position: overrides.position ?? 0,
    parent_task_id: overrides.parent_task_id || null,
  }
}

/**
 * Create multiple test tasks
 */
export function createTestTasks(count: number, overrides: Partial<Task> = {}): Task[] {
  return Array.from({ length: count }, (_, i) =>
    createTestTask({
      ...overrides,
      position: overrides.position ?? i,
      title: overrides.title || `Test Task ${i + 1}`,
    })
  )
}

/**
 * Snapshot factory function
 */
export function createTestSnapshot(overrides: Partial<any> = {}) {
  const now = new Date().toISOString()
  return {
    id: overrides.id || `test-snapshot-${Date.now()}`,
    user_id: overrides.user_id || 'test-user-id',
    title: overrides.title || 'Test Snapshot',
    description: overrides.description || null,
    snapshot_data: overrides.snapshot_data || {
      tasks: [],
      created_at: now,
    },
    created_at: overrides.created_at || now,
  }
}

/**
 * Set viewport dimensions for testing
 */
export function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })

  // Update matchMedia mock
  const matchMediaMock = mockMatchMedia(width)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMediaMock,
  })

  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

/**
 * Set pointer type for testing
 */
export function setPointerType(type: 'mouse' | 'touch' | 'pen') {
  // This is handled by PointerEvent mocks in browser-api-mocks.ts
  // Components should check event.pointerType
  return type
}

/**
 * Render component with specific viewport size
 */
export function renderWithViewport(
  ui: ReactElement,
  viewport: { width: number; height: number },
  options?: Omit<RenderOptions, 'wrapper'>
) {
  setViewport(viewport.width, viewport.height)
  return render(ui, options)
}

/**
 * Render with viewport preset
 */
export function renderWithViewportPreset(
  ui: ReactElement,
  preset: keyof typeof VIEWPORT_PRESETS,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const viewport = VIEWPORT_PRESETS[preset]
  return renderWithViewport(ui, viewport, options)
}

/**
 * Common render wrapper with providers
 * Add any global providers here (ThemeProvider, etc.)
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    ...options,
    // Add providers here if needed
    // wrapper: ({ children }) => <ThemeProvider>{children}</ThemeProvider>,
  })
}

/**
 * Wait for async operations
 */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Create a mock function that resolves after a delay
 */
export function createDelayedMock<T>(value: T, delay: number = 0) {
  return vi.fn(() => new Promise<T>((resolve) => setTimeout(() => resolve(value), delay)))
}

// Note: vi is imported from vitest but not re-exported to avoid conflicts
// Import vi directly from 'vitest' in test files
