import { test, expect } from '@playwright/test'

test.describe('New User Onboarding Journey', () => {
  test('completes new user onboarding flow', async ({ page }) => {
    // Visit home page
    await page.goto('/')
    await expect(page).toHaveTitle(/time horizon/i)

    // Click "Create Account"
    await page.click('text=Create Account')

    // Sign up with email
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')

    // Note: Email confirmation would be handled separately in a real test
    // For now, we'll assume the user is already confirmed

    // Login
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'testpassword123')
    await page.click('button[type="submit"]')

    // See empty horizons view
    await page.waitForURL('/horizons')
    await expect(page.locator('text=7 days')).toBeVisible()
    await expect(page.locator('text=30 days')).toBeVisible()
    await expect(page.locator('text=180 days')).toBeVisible()
    await expect(page.locator('text=Someday')).toBeVisible()

    // Create first task
    const inputs = page.locator('input[type="text"]')
    if (await inputs.count() > 0) {
      await inputs.first().fill('My first task')
      await inputs.first().press('Enter')

      // Task appears in "now" horizon
      await expect(page.locator('text=My first task')).toBeVisible()
    }
  })
})
