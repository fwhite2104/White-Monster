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
    radius: 5,
    variant: 'zero_sugar',
    pack_size: 'all',
    center: { lat: 51.8985, lng: -8.4756 },
    sort: 'price',
  },
}

const MOCK_STORES = {
  stores: [
    {
      id: 'store-1',
      name: 'Tesco Cork City',
      address: 'Paul Street, Cork',
      lat: 51.8985,
      lng: -8.4756,
      retailer: 'tesco',
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'store-2',
      name: 'Dunnes Stores Patrick St',
      address: 'Patrick Street, Cork',
      lat: 51.8975,
      lng: -8.4712,
      retailer: 'dunnes',
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
}

async function setupMockData(page: Page) {
  await page.context().grantPermissions(['geolocation'])
  await page.context().setGeolocation({ latitude: 51.8985, longitude: -8.4756 })
  await page.route('**/api/prices*', async (route) => {
    await route.fulfill({ json: MOCK_PRICES })
  })
  await page.route('**/api/stores*', async (route) => {
    await route.fulfill({ json: MOCK_STORES })
  })
  await page.goto('/')
  await expect(page.getByText(/€2.50|€2.65/).first()).toBeVisible({ timeout: 15000 })
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

  test('bottom tab navigation switches views', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await setupMockData(page)
    await expect(page.getByRole('tab', { name: 'List' })).toBeVisible()
    await page.getByRole('tab', { name: 'Deals' }).click({ force: true })
    await expect(page.getByText(/Item Comparison|vs/).first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('tab', { name: 'Stores' }).click({ force: true })
    await expect(page.getByText(/Open in Maps/).first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('tab', { name: 'List' }).click({ force: true })
    await expect(page.getByText('Tesco Cork City').first()).toBeVisible({ timeout: 5000 })
  })

  test('skip-to-content link is present after location granted', async ({ page }) => {
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
    await page.route('**/api/stores*', async (route) => {
      await route.fulfill({ json: MOCK_STORES })
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
    await page.route('**/api/stores*', async (route) => {
      await route.fulfill({ json: MOCK_STORES })
    })
    await page.goto('/')
    await expect(page.getByText(/no prices found/i).first()).toBeVisible({ timeout: 15000 })
  })
})
