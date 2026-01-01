import { test, expect } from '@playwright/test'

const testEmail = process.env.E2E_TEST_EMAIL
const testPassword = process.env.E2E_TEST_PASSWORD

test.describe('Auth flows', () => {
  test('oauth callback errors route back to login', async ({ page }) => {
    await page.goto('/auth/callback?error=access_denied&error_description=OAuth%20denied')
    await page.waitForURL('**/auth/login**')
    await expect(page.getByText(/oauth denied/i)).toBeVisible()
  })

  test('signs in and signs out', async ({ page }) => {
    test.skip(!testEmail || !testPassword, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run this test.')

    await page.goto('/auth/login')
    await page.getByLabel(/email/i).fill(testEmail!)
    await page.getByLabel(/password/i).fill(testPassword!)
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('**/horizons', { timeout: 15000 })

    await page.getByRole('button', { name: /settings/i }).click()
    await page.getByRole('button', { name: /sign out/i }).click()

    await page.waitForURL('**/', { timeout: 10000 })
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible()
  })
})
