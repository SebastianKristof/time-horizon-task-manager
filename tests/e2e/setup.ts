/**
 * E2E test setup and utilities
 * 
 * Note: For Playwright tests, use globalSetup/globalTeardown in playwright.config.ts
 * This file is for shared utilities and helpers.
 */

import { test as base, type Page, expect } from '@playwright/test'

// Test environment setup
export const test = base.extend({
  // Add custom fixtures here if needed
  // Example: authenticatedPage, testUser, etc.
})

// Authentication helpers
export async function loginAsTestUser(page: Page, email: string, password: string) {
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('/horizons', { timeout: 10000 })
}

// Check if user is authenticated (not redirected to login)
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto('/horizons')
  await page.waitForLoadState('networkidle')
  return !page.url().includes('/auth/login')
}

// Skip test if not authenticated
export function skipIfNotAuthenticated(page: Page) {
  // This can be used in beforeEach hooks
  // For now, tests handle this individually
}

// Wait for horizons view to load
export async function waitForHorizonsView(page: Page) {
  await expect(page.getByRole('heading', { name: /7 days/i })).toBeVisible()
}

// Note: Database seeding and cleanup should be done via:
// 1. Global setup/teardown in playwright.config.ts
// 2. Direct database API calls (if test database is available)
// 3. Test user management via Supabase Admin API
