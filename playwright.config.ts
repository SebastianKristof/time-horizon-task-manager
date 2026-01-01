import { defineConfig, devices } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

/**
 * Playwright configuration for E2E tests
 * 
 * Note: Playwright global setup should be configured here, not in tests/setup.ts
 * tests/setup.ts is for Vitest only.
 */

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Desktop wide view
    {
      name: 'chromium-desktop-wide',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    // Desktop narrow view (mobile emulator)
    {
      name: 'chromium-desktop-narrow',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
      },
    },
    // Mobile view
    {
      name: 'chromium-mobile',
      use: {
        ...devices['iPhone 12'],
      },
    },
    {
      name: 'webkit-mobile',
      use: {
        ...devices['iPhone SE'],
      },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
})

// Global setup for Playwright (not in tests/setup.ts)
// This runs once before all tests
// export async function globalSetup() {
//   // Add any Playwright-specific setup here
// }

// Global teardown for Playwright
// export async function globalTeardown() {
//   // Add any Playwright-specific cleanup here
// }
