import { test, expect, Page } from '@playwright/test'

const MOCK_PRICES = {
  prices: [
    {
      id: 'price-1',
      store_id: 'store-1',
      product_id: 'prod-1',
      price: '2.50',
      source: 'scraper',
      scraped_at: '2026-06-06T12:00:00Z',
      stores: {
        id: 'store-1',
        name: 'Tesco Cork City',
        retailer: 'tesco',
        address: 'Paul Street, Cork',
        suburb: 'Cork City Centre',
        lat: 51.8985,
        lng: -8.4756,
      },
      products: {
        id: 'prod-1',
        name: 'Monster Energy Zero Ultra',
        variant: 'zero_sugar',
        size_ml: 500,
        image_url: null,
        pack_size: 'single',
      },
      distance: 1200,
      per_can_price: 2.50,
    },
    {
      id: 'price-2',
      store_id: 'store-2',
      product_id: 'prod-2',
      price: '2.65',
      source: 'scraper',
      scraped_at: '2026-06-06T12:00:00Z',
      stores: {
        id: 'store-2',
        name: 'Dunnes Stores Patrick St',
        retailer: 'dunnes',
        address: 'Patrick Street, Cork',
        suburb: 'Cork City Centre',
        lat: 51.8975,
        lng: -8.4712,
      },
      products: {
        id: 'prod-2',
        name: 'Monster Energy Zero Ultra',
        variant: 'zero_sugar',
        size_ml: 500,
        image_url: null,
        pack_size: 'single',
      },
      distance: 800,
      per_can_price: 2.65,
    },
  ],
  meta: {
    total: 2,
    radius: 10,
    variant: 'zero_sugar',
    pack_size: '4_pack',
    center: { lat: 51.8985, lng: -8.4756 },
    sort: 'price',
  },
}

async function setupMockData(page: Page) {
  await page.context().grantPermissions(['geolocation'])
  await page.context().setGeolocation({ latitude: 51.8985, longitude: -8.4756 })
  await page.route('**/api/prices*', async (route) => {
    await route.fulfill({ json: MOCK_PRICES })
  })
  await page.goto('/')
  await expect(page.getByText(/€2\.50|€2\.65/).first()).toBeVisible({ timeout: 15000 })
}

test.describe('Dashboard — Loaded State', () => {
  test('shows price results after geolocation and data load', async ({ page }) => {
    await setupMockData(page)
    await expect(page.getByText('€2.50').first()).toBeVisible()
    await expect(page.getByText('€2.65').first()).toBeVisible()
    await expect(page.getByText('Best Price').first()).toBeVisible()
  })

  test('displays store names and prices in the list', async ({ page }) => {
    await setupMockData(page)
    await expect(page.getByText('Tesco Cork City').first()).toBeVisible()
    await expect(page.getByText('Dunnes Stores Patrick St').first()).toBeVisible()
  })

  test('shows filter controls', async ({ page }) => {
    await setupMockData(page)
    await expect(page.getByTestId('filter-variant')).toBeVisible()
    await expect(page.getByTestId('filter-pack-size')).toBeVisible()
    await expect(page.getByTestId('filter-sort')).toBeVisible()
    await expect(page.getByLabel(/Radius/i)).toBeVisible()
  })

  test('changing variant updates URL and refetches prices', async ({ page }) => {
    await page.context().grantPermissions(['geolocation'])
    await page.context().setGeolocation({ latitude: 51.8985, longitude: -8.4756 })

    await page.route('**/api/prices*', async (route) => {
      await route.fulfill({ json: MOCK_PRICES })
    })

    await page.goto('/')
    await expect(page.getByText('€2.50').first()).toBeVisible({ timeout: 15000 })

    const originalResponse = page.waitForResponse(
      (res) => res.url().includes('/api/prices') && res.url().includes('variant=original'),
      { timeout: 10000 }
    )

    await page.getByTestId('filter-variant').click()
    await page.getByRole('option', { name: 'Monster Energy Original' }).click()

    await page.waitForURL(/variant=original/, { timeout: 10000 })
    await originalResponse
  })

  test('opens price detail on tap', async ({ page }) => {
    await setupMockData(page)
    await page.getByTestId('price-card').filter({ hasText: 'Tesco Cork City' }).click()
    await expect(page.getByTestId('price-detail-sheet')).toBeVisible()
    await expect(page.getByText('Report a price at this store').first()).toBeVisible()
  })

  test('opens report price modal', async ({ page }) => {
    await setupMockData(page)
    await page.getByTestId('report-fab').click()
    await expect(page.getByTestId('report-price-modal')).toBeVisible()
    await expect(page.getByLabel('Store name')).toBeVisible()
  })

  test('skip-to-content link is present', async ({ page }) => {
    await setupMockData(page)
    await expect(page.getByText('Skip to content').first()).toBeVisible()
  })
})

test.describe('Dashboard — Error State', () => {
  test('shows error message when API fails', async ({ page }) => {
    await page.context().grantPermissions(['geolocation'])
    await page.context().setGeolocation({ latitude: 51.8985, longitude: -8.4756 })
    await page.route('**/api/prices*', async (route) => {
      await route.fulfill({ status: 500, body: 'Server Error' })
    })
    await page.goto('/')
    await expect(page.getByText(/error|fail|try again|something went wrong/i).first()).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Dashboard — Empty State', () => {
  test('shows no results when no prices match filters', async ({ page }) => {
    await page.context().grantPermissions(['geolocation'])
    await page.context().setGeolocation({ latitude: 51.8985, longitude: -8.4756 })
    await page.route('**/api/prices*', async (route) => {
      await route.fulfill({ json: { prices: [], meta: { total: 0 } } })
    })
    await page.goto('/')
    await expect(page.getByText(/no prices found/i).first()).toBeVisible({ timeout: 15000 })
  })
})
