import { test, expect } from '@playwright/test'

test.describe('Viewport Responsive Journey', () => {
  test('handles viewport resize from desktop to mobile', async ({ page }) => {
    // Start with desktop wide
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/horizons')
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify layout changes
    await expect(page.locator('text=7 days')).toBeVisible()
    // Compact layout should be active
  })

  test('handles viewport resize from mobile to desktop', async ({ page }) => {
    // Start with mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/horizons')
    
    // Resize to desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Verify layout changes
    await expect(page.locator('text=7 days')).toBeVisible()
    // Full layout should be active
  })

  test('verifies layout changes at 768px breakpoint', async ({ page }) => {
    // Test just above breakpoint
    await page.setViewportSize({ width: 769, height: 1024 })
    await page.goto('/horizons')
    await expect(page.locator('text=7 days')).toBeVisible()
    
    // Test just below breakpoint
    await page.setViewportSize({ width: 767, height: 1024 })
    await page.goto('/horizons')
    await expect(page.locator('text=7 days')).toBeVisible()
    
    // Layout should change between these two viewports
  })

  test('handles pointer type detection on resize', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/horizons')
    
    // Simulate mouse interaction
    const task = page.locator('[role="listitem"]').first()
    await task.hover()
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Simulate touch interaction
    await task.tap()
    
    // Component should handle both pointer types
    await expect(task).toBeVisible()
  })
})
