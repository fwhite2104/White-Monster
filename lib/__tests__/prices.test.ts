import { describe, it, expect } from 'vitest'
import { summarizeNationalPrices } from '@/lib/prices'
import type { PriceEntry } from '@/lib/prices'
import type { StoreData, ProductData } from '@/lib/types'

function makeStore(overrides: Partial<StoreData> = {}): StoreData {
  return {
    id: 'store-1',
    name: 'Dunnes Stores Douglas',
    retailer: 'dunnes',
    address: 'Douglas',
    suburb: 'Douglas',
    lat: 51.8758,
    lng: -8.4452,
    ...overrides,
  }
}

function makeProduct(): ProductData {
  return {
    id: 'prod-1',
    name: 'Monster Ultra White',
    variant: 'ultra_white',
    size_ml: 250,
    image_url: '',
    pack_size: 'single',
  }
}

function makePriceEntry(overrides: Partial<PriceEntry> = {}): PriceEntry {
  return {
    id: 'price-1',
    store_id: 'store-1',
    product_id: 'prod-1',
    price: 1.50,
    source: 'scraper',
    scraped_at: '2026-07-17T00:00:00Z',
    stores: makeStore(),
    products: makeProduct(),
    distance: 500,
    ...overrides,
  }
}

describe('summarizeNationalPrices', () => {
  it('groups entries by retailer and returns nearest distance', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({
        stores: makeStore({ id: 's1', name: 'Dunnes Douglas', retailer: 'dunnes', suburb: 'Douglas' }),
        distance: 500,
      }),
      makePriceEntry({
        id: 'price-2',
        store_id: 's2',
        stores: makeStore({ id: 's2', name: 'Dunnes Wilton', retailer: 'dunnes', suburb: 'Wilton', lat: 51.8912, lng: -8.5123 }),
        distance: 300,
      }),
      makePriceEntry({
        id: 'price-3',
        store_id: 's3',
        stores: makeStore({ id: 's3', name: 'Dunnes City Centre', retailer: 'dunnes', suburb: 'Cork City', lat: 51.8985, lng: -8.4756 }),
        distance: 800,
      }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries).toHaveLength(1)

    const dunnes = summaries[0]
    expect(dunnes.retailer).toBe('dunnes')
    expect(dunnes.price).toBe(1.50)
    expect(dunnes.nearestDistance).toBe(300)
    expect(dunnes.storeCount).toBe(3)
  })

  it('returns one summary per retailer', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({
        stores: makeStore({ id: 's1', retailer: 'dunnes', name: 'Dunnes Douglas' }),
        distance: 500,
      }),
      makePriceEntry({
        id: 'price-2',
        store_id: 's2',
        price: 1.45,
        stores: makeStore({ id: 's2', retailer: 'tesco', name: 'Tesco Metro' }),
        distance: 200,
      }),
      makePriceEntry({
        id: 'price-3',
        store_id: 's3',
        price: 1.60,
        stores: makeStore({ id: 's3', retailer: 'supervalu', name: 'SuperValu Bishopstown' }),
        distance: 1000,
      }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries).toHaveLength(3)

    const dunnes = summaries.find((s) => s.retailer === 'dunnes')!
    expect(dunnes.storeCount).toBe(1)
    expect(dunnes.nearestDistance).toBe(500)

    const tesco = summaries.find((s) => s.retailer === 'tesco')!
    expect(tesco.price).toBe(1.45)
    expect(tesco.storeCount).toBe(1)
    expect(tesco.nearestDistance).toBe(200)

    const supervalu = summaries.find((s) => s.retailer === 'supervalu')!
    expect(supervalu.price).toBe(1.60)
    expect(supervalu.storeCount).toBe(1)
  })

  it('handles single store correctly', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({ distance: 400 }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries).toHaveLength(1)
    expect(summaries[0].storeCount).toBe(1)
    expect(summaries[0].nearestDistance).toBe(400)
  })

  it('returns empty array for no entries', () => {
    const summaries = summarizeNationalPrices([])
    expect(summaries).toHaveLength(0)
  })

  it('groups same retailer with different products into one summary', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({
        stores: makeStore({ id: 's1', retailer: 'tesco', name: 'Tesco Metro' }),
        distance: 300,
        products: makeProduct(),
      }),
      makePriceEntry({
        id: 'price-2',
        store_id: 's1',
        stores: makeStore({ id: 's1', retailer: 'tesco', name: 'Tesco Metro' }),
        distance: 300,
        products: { ...makeProduct(), id: 'prod-2', variant: 'original' },
      }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries).toHaveLength(1)
    expect(summaries[0].storeCount).toBe(1)
    // Price should come from the first entry
    expect(summaries[0].price).toBe(1.50)
  })

  it('stores locations are included in the summary', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({
        stores: makeStore({ id: 's1', name: 'Dunnes Douglas' }),
        distance: 500,
        store_id: 's1',
      }),
      makePriceEntry({
        id: 'price-2',
        store_id: 's2',
        stores: makeStore({ id: 's2', name: 'Dunnes Wilton' }),
        distance: 300,
      }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries).toHaveLength(1)
    expect(summaries[0].storeLocations).toHaveLength(2)
    expect(summaries[0].storeLocations[0].name).toBe('Dunnes Douglas')
    expect(summaries[0].storeLocations[1].name).toBe('Dunnes Wilton')
  })

  it('passes through clubcard pricing for Tesco', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({
        stores: makeStore({ id: 's1', retailer: 'tesco', name: 'Tesco Metro' }),
        clubcard_price: 1.30,
        has_clubcard_pricing: true,
        distance: 400,
      }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries[0].hasClubcardPricing).toBe(true)
    expect(summaries[0].clubcardPrice).toBe(1.30)
  })

  it('uses the minimum distance across all entries', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({ distance: 5000, stores: makeStore({ id: 's1' }) }),
      makePriceEntry({ id: 'p2', store_id: 's2', distance: 200, stores: makeStore({ id: 's2' }) }),
      makePriceEntry({ id: 'p3', store_id: 's3', distance: 800, stores: makeStore({ id: 's3' }) }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries[0].nearestDistance).toBe(200)
  })
})
