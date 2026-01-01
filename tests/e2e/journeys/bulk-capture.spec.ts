import { test, expect } from '@playwright/test'

test.describe('Bulk Capture Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/capture')
    
    // Skip if redirected to login
    if (page.url().includes('/auth/login')) {
      test.skip()
      return
    }
  })

  test.skip('captures multiple tasks at once', async ({ page }) => {
    // Wait for capture form to load
    await expect(page.getByRole('heading', { name: /capture tasks/i })).toBeVisible()
    
    // Find the textarea
    const textarea = page.getByRole('textbox', { name: /task/i }).or(page.locator('textarea')).first()
    await expect(textarea).toBeVisible()
    
    // Fill with multiple tasks
    await textarea.fill('Task 1\nTask 2\nTask 3\nTask 4')
    
    // Wait a bit for task entries to sync
    await page.waitForTimeout(500)
    
    // Find and click the submit button
    const submitButton = page.getByRole('button', { name: /add tasks/i })
    await expect(submitButton).toBeVisible()
    await submitButton.click()
    
    // Wait for redirect to horizons view
    await page.waitForURL('/horizons', { timeout: 10000 })
    
    // Verify all tasks appear in horizons view
    await expect(page.getByText('Task 1')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Task 2')).toBeVisible()
    await expect(page.getByText('Task 3')).toBeVisible()
    await expect(page.getByText('Task 4')).toBeVisible()
  })
})
