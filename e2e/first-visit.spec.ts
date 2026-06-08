import { test, expect } from '@playwright/test'

test.describe('First Visit Screen', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders the header with Monster Cork branding', async ({ page }) => {
    const header = page.locator('header')
    await expect(header).toBeVisible()
    await expect(header.getByText('Monster')).toBeVisible()
    await expect(header.getByText('Cork')).toBeVisible()
  })

  test('shows the welcome prompt and CTA button', async ({ page }) => {
    await expect(page.getByText(/Find the cheapest/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Monster').first()).toBeVisible()
    await expect(page.getByText(/near you/)).toBeVisible()
    await expect(page.getByText('Find nearby prices')).toBeVisible()
  })

  test('shows "Or search by area" secondary action', async ({ page }) => {
    await expect(page.getByText('Or search by area')).toBeVisible({ timeout: 10000 })
  })

  test('shows "Report a Price" button on first visit', async ({ page }) => {
    await expect(page.getByText('Report a Price').first()).toBeVisible()
  })

  test('has Automated checks and Community reports badges', async ({ page }) => {
    await expect(page.getByText('Automated checks')).toBeVisible()
    await expect(page.getByText('Community reports')).toBeVisible()
  })

  test('footer contains attribution and links', async ({ page }) => {
    const footer = page.locator('footer')
    await expect(footer).toBeVisible()
    const linkCount = await footer.locator('a').count()
    expect(linkCount).toBeGreaterThanOrEqual(1)
  })

  test('page body describes the service', async ({ page }) => {
    await expect(page.getByText(/Live prices from every Cork store/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Price comparison for educational purposes/)).toBeVisible()
  })
})
