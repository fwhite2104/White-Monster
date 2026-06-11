/**
 * UI audit harness — screenshots at 375/768/1440 with mocked API data.
 * Run against a live `next dev` server on localhost:3000.
 *
 * Usage:
 *   node scripts/ui-audit.mjs
 *
 * Output: audit-shots/<label>.png
 * Requires system chromium (playwright channel: 'chromium').
 */

import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'audit-shots')
mkdirSync(OUT, { recursive: true })

const BASE_URL = process.env.AUDIT_URL ?? 'http://localhost:3000'

// ── Fixtures (mirrors e2e/dashboard.spec.ts shape) ───────────────────────────

const MOCK_PRICES = {
  prices: [
    {
      id: 'price-1',
      store_id: 'store-1',
      product_id: 'prod-1',
      price: '2.29',
      source: 'scraper',
      scraped_at: new Date(Date.now() - 3600_000).toISOString(),
      per_can_price: 0.5725,
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
        pack_size: '4_pack',
      },
      distance: 800,
    },
    {
      id: 'price-2',
      store_id: 'store-2',
      product_id: 'prod-2',
      price: '2.50',
      source: 'scraper',
      scraped_at: new Date(Date.now() - 7200_000).toISOString(),
      per_can_price: 2.5,
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
      distance: 1200,
    },
    {
      id: 'price-3',
      store_id: 'store-3',
      product_id: 'prod-3',
      price: '2.65',
      source: 'user_upload',
      scraped_at: new Date(Date.now() - 86400_000).toISOString(),
      per_can_price: 2.65,
      stores: {
        id: 'store-3',
        name: 'SuperValu Wilton',
        retailer: 'supervalu',
        address: 'Wilton Shopping Centre',
        suburb: 'Wilton',
        lat: 51.8892,
        lng: -8.5012,
      },
      products: {
        id: 'prod-3',
        name: 'Monster Energy Zero Ultra',
        variant: 'zero_sugar',
        size_ml: 500,
        image_url: null,
        pack_size: 'single',
      },
      distance: 2200,
    },
  ],
  meta: {
    total: 3,
    radius: 10,
    variant: 'zero_sugar',
    pack_size: '4_pack',
    center: { lat: 51.8985, lng: -8.4756 },
    sort: 'price',
  },
}

const MOCK_STORES = { stores: MOCK_PRICES.prices.map((p) => p.stores) }
const MOCK_DEALS = { deals: [] }

// ── Viewports ────────────────────────────────────────────────────────────────

const VIEWPORTS = [
  { name: '375', width: 375, height: 812, mobile: true },
  { name: '768', width: 768, height: 1024, mobile: false },
  { name: '1440', width: 1440, height: 900, mobile: false },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setupMocks(context) {
  await context.grantPermissions(['geolocation'])
  await context.setGeolocation({ latitude: 51.8985, longitude: -8.4756 })
  await context.route('**/api/prices**', (route) => route.fulfill({ json: MOCK_PRICES }))
  await context.route('**/api/stores**', (route) => route.fulfill({ json: MOCK_STORES }))
  await context.route('**/api/deals**', (route) => route.fulfill({ json: MOCK_DEALS }))
  await context.route('**/api/health**', (route) => route.fulfill({ json: { ok: true } }))
}

async function shot(page, label) {
  await page.screenshot({ path: join(OUT, `${label}.png`), fullPage: false })
  console.log(`  ✓ ${label}.png`)
}

async function waitForContent(page) {
  await page
    .waitForSelector('[aria-label="Price results"], h1', { timeout: 15_000 })
    .catch(() => {})
  await page.waitForTimeout(600)
}

// ── Main ─────────────────────────────────────────────────────────────────────

const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium-browser',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

for (const vp of VIEWPORTS) {
  console.log(`\n[${vp.name}px]`)

  // FirstVisit — no geolocation context
  const noGeoCtx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  await noGeoCtx.route('**/api/**', (route) => route.fulfill({ json: {} }))
  const noGeoPage = await noGeoCtx.newPage()
  await noGeoPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await noGeoPage.waitForTimeout(800)
  await shot(noGeoPage, `${vp.name}-first-visit`)
  await noGeoCtx.close()

  // Main context with mocked data
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.mobile ? 2 : 1,
  })
  await setupMocks(ctx)
  const page = await ctx.newPage()
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await waitForContent(page)

  // List tab (default landing view)
  await shot(page, `${vp.name}-list`)

  if (vp.mobile) {
    // Deals tab
    const dealsTab = page.getByRole('tab', { name: 'Deals' })
    if (await dealsTab.isVisible()) {
      await dealsTab.click({ force: true })
      await page.waitForTimeout(500)
      await shot(page, `${vp.name}-deals`)
    }

    // Stores tab
    const storesTab = page.getByRole('tab', { name: 'Stores' })
    if (await storesTab.isVisible()) {
      await storesTab.click({ force: true })
      await page.waitForTimeout(800)
      await shot(page, `${vp.name}-stores`)
    }

    // Search tab
    const searchTab = page.getByRole('tab', { name: 'Search' })
    if (await searchTab.isVisible()) {
      await searchTab.click({ force: true })
      await page.waitForTimeout(400)
      await shot(page, `${vp.name}-search`)
    }

    // Back to List then open filter drawer
    const listTab = page.getByRole('tab', { name: 'List' })
    if (await listTab.isVisible()) {
      await listTab.click({ force: true })
      await page.waitForTimeout(400)
      const moreBtn = page.getByRole('button', { name: /More/i })
      if (await moreBtn.isVisible()) {
        await moreBtn.click({ force: true })
        await page.waitForTimeout(400)
        await shot(page, `${vp.name}-filter-drawer`)
        await page.keyboard.press('Escape')
      }
    }
  }

  await ctx.close()
}

await browser.close()
console.log(`\nDone — screenshots in audit-shots/`)
