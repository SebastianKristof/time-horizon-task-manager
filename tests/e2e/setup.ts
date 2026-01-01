/**
 * E2E test setup and utilities
 */

import { test as base } from '@playwright/test'

// Test environment setup
export const test = base.extend({
  // Add custom fixtures here if needed
  // Example: authenticatedPage, testUser, etc.
})

// Authentication helpers
export async function loginAsTestUser(page: any, email: string, password: string) {
  await page.goto('/auth/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL('/horizons')
}

// Database seeding helpers
export async function seedTestData(supabaseClient: any, userId: string) {
  // Seed test tasks, snapshots, etc.
  // This would interact with the actual test database
}

// Cleanup utilities
export async function cleanupTestData(supabaseClient: any, userId: string) {
  // Clean up test data after tests
  // This would delete test tasks, snapshots, etc.
}
