/**
 * Accessibility testing helpers using jest-axe
 * 
 * jest-axe is compatible with Vitest and provides accessibility testing
 * for unit and integration tests.
 */

import { toHaveNoViolations } from 'jest-axe'
import { expect } from 'vitest'
import { axe, type AxeResults } from 'jest-axe'

// Extend Vitest matchers
expect.extend(toHaveNoViolations)

/**
 * Run axe accessibility check on a container element
 * @param container - The container element to check
 * @param options - Axe options
 * @returns Promise<AxeResults>
 */
export async function checkAccessibility(
  container: HTMLElement,
  options?: Parameters<typeof axe>[1]
): Promise<AxeResults> {
  return await axe(container, options)
}

/**
 * Assert that a container has no accessibility violations
 * @param container - The container element to check
 * @param options - Axe options
 */
export async function expectNoViolations(
  container: HTMLElement,
  options?: Parameters<typeof axe>[1]
) {
  const results = await checkAccessibility(container, options)
  expect(results).toHaveNoViolations()
}

/**
 * Common axe configuration for React components
 */
export const axeConfig = {
  rules: {
    // Disable color-contrast for tests (can be flaky)
    'color-contrast': { enabled: false },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
}

/**
 * Helper to test screen reader announcements
 * Note: This is a placeholder - actual screen reader testing
 * requires more sophisticated tools or manual testing
 */
export function getAriaLabel(element: HTMLElement): string | null {
  return element.getAttribute('aria-label')
}

export function getAriaLabelledBy(element: HTMLElement): string | null {
  return element.getAttribute('aria-labelledby')
}

export function hasAriaLabel(element: HTMLElement): boolean {
  return !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby')
  )
}
