import { test, expect } from '@playwright/test'

test.describe('Bulk Capture Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    // Add login logic here
  })

  test('captures multiple tasks at once', async ({ page }) => {
    // Navigate to capture page
    await page.goto('/capture')

    // Paste list of tasks
    const textarea = page.locator('textarea')
    await textarea.fill('Task 1\nTask 2\nTask 3\nTask 4')

    // Assign horizons to tasks
    // This would involve clicking horizon buttons for each task

    // Submit
    await page.click('button:has-text("Add tasks")')

    // Verify all tasks appear in horizons view
    await page.waitForURL('/horizons')
    await expect(page.locator('text=Task 1')).toBeVisible()
    await expect(page.locator('text=Task 2')).toBeVisible()
    await expect(page.locator('text=Task 3')).toBeVisible()
    await expect(page.locator('text=Task 4')).toBeVisible()
  })
})
