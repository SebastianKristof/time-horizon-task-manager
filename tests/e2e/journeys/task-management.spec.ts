import { test, expect } from '@playwright/test'

test.describe('Task Management Journey', () => {
  // Skip these tests if no authenticated user is available
  // In a real test environment, you'd set up test users via API/database
  test.skip('manages tasks across horizons', async ({ page }) => {
    // This test requires authentication setup
    // For now, skip it until test user setup is implemented
    // Remove .skip() when test users are available
    
    await page.goto('/horizons')
    
    // If redirected to login, the test should be skipped at the test.skip() level
    // This code won't run until test.skip() is removed

    // Wait for horizons view to load
    await expect(page.getByRole('heading', { name: /7 days/i })).toBeVisible()

    // Create a task in the "now" horizon
    // Find the "Add a task" button for the first horizon and click it
    const addTaskButtons = page.locator('button:has-text("Add a task")').or(page.locator('button[aria-label*="Add a task" i]'))
    if (await addTaskButtons.count() > 0) {
      await addTaskButtons.first().click()
      
      // Wait for input to appear and fill it
      const taskInput = page.locator('input[type="text"]').filter({ hasText: '' }).first()
      await taskInput.waitFor({ state: 'visible' })
      await taskInput.fill('Test task in now horizon')
      await taskInput.press('Enter')

      // Verify task appears
      await expect(page.getByText('Test task in now horizon')).toBeVisible()
    }

    // Verify horizon sections are visible
    await expect(page.getByRole('heading', { name: /7 days/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /30 days/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /180 days/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /someday/i })).toBeVisible()
  })
})
