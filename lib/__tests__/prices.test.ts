import { describe, it, expect } from 'vitest'
import { enrichPrice, summarizeNationalPrices, createNationalPriceFromSummary, computeBestPrice, expandNationalPrices, mergeUserPrices } from '@/lib/prices'
import type { PriceEntry, NationalSummary, UserPriceRecord } from '@/lib/prices'
import type { StoreData, ProductData, PriceWithJoins } from '@/lib/types'

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

describe('expandNationalPrices', () => {
  const CORK = { lat: 51.8985, lng: -8.4756 }
  const RADIUS_M = 10_000

  function makeNationalPrice(overrides: Partial<PriceWithJoins> = {}): PriceWithJoins {
    return {
      id: 'nat-price-1',
      store_id: 'nat-store-1',
      product_id: 'prod-1',
      price: 2.5,
      source: 'scraper',
      scraped_at: '2026-07-17T00:00:00Z',
      stores: {
        id: 'nat-store-1',
        name: 'Dunnes Stores Ireland (National)',
        retailer: 'dunnes',
        address: '',
        suburb: 'Ireland (national)',
        lat: 0,
        lng: 0,
      },
      products: makeProduct(),
      ...overrides,
    }
  }

  it('expands national price to physical stores in radius (radius filter works)', () => {
    const natPrice = makeNationalPrice()
    const physical = makeStore({
      id: 'phys-1',
      name: 'Dunnes Douglas',
      retailer: 'dunnes',
      lat: 51.8758,
      lng: -8.4452,
    })
    const allStores = [physical]

    const result = expandNationalPrices([natPrice], allStores, CORK.lat, CORK.lng, RADIUS_M, [])

    expect(result).toHaveLength(1)
    expect(result[0].store_id).toBe('phys-1')
    expect(result[0].stores.name).toBe('Dunnes Douglas')
    expect(result[0].distance).toBeGreaterThan(0)
    expect(Number.isFinite(result[0].distance)).toBe(true)
  })

  it('surfaces null-coord national store entry with Infinity distance when no physical stores in radius', () => {
    const natPrice = makeNationalPrice()
    const nationalStore: StoreData = {
      id: 'nat-store-1',
      name: 'Dunnes Stores Ireland (National)',
      retailer: 'dunnes',
      address: '',
      suburb: 'Ireland (national)',
      lat: null,
      lng: null,
    }
    const farPhysical = makeStore({
      id: 'far-phys',
      name: 'Dunnes Far Away',
      retailer: 'dunnes',
      lat: 53.0,
      lng: -6.0,
    })
    const allStores = [farPhysical, nationalStore]

    const result = expandNationalPrices([natPrice], allStores, CORK.lat, CORK.lng, RADIUS_M, [])

    expect(result).toHaveLength(1)
    expect(result[0].distance).toBe(Infinity)
    expect(Number.isNaN(result[0].distance)).toBe(false)
  })

  it('preserves valid-coord national fallback distance (regression guard)', () => {
    const natPrice = makeNationalPrice()
    const nationalStore: StoreData = {
      id: 'nat-store-1',
      name: 'Dunnes Stores Ireland (National)',
      retailer: 'dunnes',
      address: '',
      suburb: 'Ireland (national)',
      lat: 51.9,
      lng: -8.5,
    }
    const allStores = [nationalStore]

    const result = expandNationalPrices([natPrice], allStores, CORK.lat, CORK.lng, RADIUS_M, [])

    expect(result).toHaveLength(1)
    expect(result[0].distance).toBeGreaterThan(0)
    expect(Number.isFinite(result[0].distance)).toBe(true)
  })

  it('drops invalid-coord physical stores but retains null-coord national store entries', () => {
    const natPrice = makeNationalPrice()
    const badCoordsPhysical: StoreData = {
      id: 'bad-phys',
      name: 'Dunnes Invalid Coords',
      retailer: 'dunnes',
      address: '',
      suburb: 'Cork',
      lat: 91,
      lng: -8.47,
    }
    const nanPhysical: StoreData = {
      id: 'nan-phys',
      name: 'Dunnes NaN Coords',
      retailer: 'dunnes',
      address: '',
      suburb: 'Cork',
      lat: NaN,
      lng: NaN,
    }
    const nationalNull: StoreData = {
      id: 'nat-store-1',
      name: 'Dunnes Stores Ireland (National)',
      retailer: 'dunnes',
      address: '',
      suburb: 'Ireland (national)',
      lat: null,
      lng: null,
    }
    const allStores = [badCoordsPhysical, nanPhysical, nationalNull]

    const result = expandNationalPrices([natPrice], allStores, CORK.lat, CORK.lng, RADIUS_M, [])

    expect(result).toHaveLength(1)
    expect(result[0].stores.id).toBe('nat-store-1')
    expect(result[0].distance).toBe(Infinity)
  })

  it('dedup still prevents duplicate (store_id, product_id) entries via seenStoreProduct', () => {
    const natPrice = makeNationalPrice()
    const physical = makeStore({
      id: 'phys-1',
      name: 'Dunnes Douglas',
      retailer: 'dunnes',
      lat: 51.8758,
      lng: -8.4452,
    })
    const matchingExisting = makePriceEntry({
      id: 'existing-1',
      store_id: 'phys-1',
      product_id: 'prod-1',
      price: 2.0,
      stores: physical,
      distance: 500,
    })
    const allStores = [physical]

    const result = expandNationalPrices([natPrice], allStores, CORK.lat, CORK.lng, RADIUS_M, [matchingExisting])

    expect(result).toHaveLength(0)
  })
})

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
    expect(dunnes.nearest_distance).toBe(300)
    expect(dunnes.store_count).toBe(3)
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
    expect(dunnes.store_count).toBe(1)
    expect(dunnes.nearest_distance).toBe(500)

    const tesco = summaries.find((s) => s.retailer === 'tesco')!
    expect(tesco.price).toBe(1.45)
    expect(tesco.store_count).toBe(1)
    expect(tesco.nearest_distance).toBe(200)

    const supervalu = summaries.find((s) => s.retailer === 'supervalu')!
    expect(supervalu.price).toBe(1.60)
    expect(supervalu.store_count).toBe(1)
  })

  it('handles single store correctly', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({ distance: 400 }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries).toHaveLength(1)
    expect(summaries[0].store_count).toBe(1)
    expect(summaries[0].nearest_distance).toBe(400)
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
    expect(summaries[0].store_count).toBe(1)
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
    expect(summaries[0].store_locations).toHaveLength(2)
    expect(summaries[0].store_locations[0].name).toBe('Dunnes Douglas')
    expect(summaries[0].store_locations[1].name).toBe('Dunnes Wilton')
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
    expect(summaries[0].has_clubcard_pricing).toBe(true)
    expect(summaries[0].clubcard_price).toBe(1.30)
  })

  it('uses the minimum distance across all entries', () => {
    const entries: PriceEntry[] = [
      makePriceEntry({ distance: 5000, stores: makeStore({ id: 's1' }) }),
      makePriceEntry({ id: 'p2', store_id: 's2', distance: 200, stores: makeStore({ id: 's2' }) }),
      makePriceEntry({ id: 'p3', store_id: 's3', distance: 800, stores: makeStore({ id: 's3' }) }),
    ]

    const summaries = summarizeNationalPrices(entries)
    expect(summaries[0].nearest_distance).toBe(200)
  })
})

describe('createNationalPriceFromSummary', () => {
  it('constructs a Price with real product info and nearest distance', () => {
    const summary: NationalSummary = {
      retailer: 'dunnes',
      price: 1.50,
      nearest_distance: 300,
      store_count: 5,
      has_clubcard_pricing: false,
      clubcard_price: null,
      per_can_price: 1.50,
      products: {
        id: 'prod-ultra-white',
        name: 'Monster Ultra White',
        variant: 'ultra_white',
        size_ml: 250,
        image_url: '',
        pack_size: 'single',
      },
      store_locations: [],
    }

    const price = createNationalPriceFromSummary(summary)
    expect(price.id).toBe('dunnes')
    expect(price.store_id).toBe('dunnes')
    expect(price.product_id).toBe('prod-ultra-white')
    expect(price.price).toBe(1.50)
    expect(price.distance).toBe(300)
    expect(price.source).toBe('scraper')
    expect(price.products?.name).toBe('Monster Ultra White')
    expect(price.products?.variant).toBe('ultra_white')
    expect(price.stores?.retailer).toBe('dunnes')
  })

  it('passes through clubcard pricing', () => {
    const summary: NationalSummary = {
      retailer: 'tesco',
      price: 2.00,
      nearest_distance: 500,
      store_count: 3,
      has_clubcard_pricing: true,
      clubcard_price: 1.70,
      products: { id: 'p1', name: 'Test', variant: 'original', size_ml: 500, image_url: '', pack_size: 'single' },
      store_locations: [],
    }

    const price = createNationalPriceFromSummary(summary)
    expect(price.has_clubcard_pricing).toBe(true)
    expect(price.clubcard_price).toBe(1.70)
  })
})

describe('computeBestPrice', () => {
  function makePrice(price: number, id = 'p1'): import('@/lib/types').Price {
    return { id, store_id: id, product_id: 'p', price, source: 'scraper', scraped_at: '', created_at: '' }
  }

  const product: ProductData = { id: 'prod', name: 'Test', variant: 'ultra_white', size_ml: 250, image_url: '', pack_size: 'single' }

  function makeSummary(retailer: string, price: number): NationalSummary {
    return {
      retailer, price, nearest_distance: 500, store_count: 2,
      has_clubcard_pricing: false, clubcard_price: null, products: product, store_locations: [],
    }
  }

  it('returns null for empty inputs', () => {
    expect(computeBestPrice([], [])).toBeNull()
  })

  it('returns cheapest regular price when no summaries', () => {
    const result = computeBestPrice([makePrice(2.00), makePrice(1.50, 'p2')], [])
    expect(result?.price).toBe(1.50)
  })

  it('returns synthetic Price from cheapest summary when no regular prices', () => {
    const result = computeBestPrice([], [makeSummary('dunnes', 1.30)])
    expect(result?.price).toBe(1.30)
    expect(result?.stores?.retailer).toBe('dunnes')
  })

  it('prefers cheaper summary over regular price', () => {
    const result = computeBestPrice(
      [makePrice(1.80)],
      [makeSummary('dunnes', 1.30)],
    )
    expect(result?.price).toBe(1.30)
  })

  it('prefers cheaper regular price over summary', () => {
    const result = computeBestPrice(
      [makePrice(1.20)],
      [makeSummary('dunnes', 1.30)],
    )
    expect(result?.price).toBe(1.20)
  })

  it('returns regular price when tied', () => {
    const result = computeBestPrice(
      [makePrice(1.50, 'p2')],
      [makeSummary('dunnes', 1.50)],
    )
    expect(result?.id).toBe('p2')
  })
})

describe('enrichPrice', () => {
  it('computes per_can_price, DRS, and clubcard fields correctly', () => {
    const result = enrichPrice(5.00, '4_pack', 'tesco', 4.50)
    expect(result.per_can_price).toBe(1.25) // 5.00 / 4
    expect(result.drs_deposit).toBe(0.60) // 0.15 * 4
    expect(result.base_price).toBe(4.40) // 5.00 - 0.60
    expect(result.clubcard_price).toBe(4.50)
    expect(result.has_clubcard_pricing).toBe(true)
  })

  it('sets has_clubcard_pricing false for non-Tesco retailers', () => {
    const result = enrichPrice(2.00, 'single', 'dunnes')
    expect(result.has_clubcard_pricing).toBe(false)
    expect(result.clubcard_price).toBeNull()
    expect(result.per_can_price).toBe(2.00)
  })

  it('handles single-can prices', () => {
    const result = enrichPrice(1.50, 'single', 'aldi')
    expect(result.per_can_price).toBe(1.50)
    expect(result.drs_deposit).toBe(0.15)
    expect(result.base_price).toBe(1.35)
  })

  it('computes per_can correctly for multipacks', () => {
    const result = enrichPrice(12.00, '8_pack', 'lidl')
    expect(result.per_can_price).toBe(1.50)
    expect(result.drs_deposit).toBe(1.20) // 0.15 * 8
  })

  it('handles missing clubcard_price as null', () => {
    const result = enrichPrice(2.00, 'single', 'tesco')
    expect(result.clubcard_price).toBeNull()
    expect(result.has_clubcard_pricing).toBe(false)
  })

  it('handles explicit null clubcard_price', () => {
    const result = enrichPrice(2.00, 'single', 'tesco', null)
    expect(result.clubcard_price).toBeNull()
    expect(result.has_clubcard_pricing).toBe(false)
  })
})

describe('mergeUserPrices', () => {
  const CORK = { lat: 51.8985, lng: -8.4756 }
  const RADIUS_M = 10_000

  function makeUserPrice(overrides: Partial<UserPriceRecord> = {}): UserPriceRecord {
    return {
      id: 'up-1',
      store_id: 'store-1',
      product_id: 'prod-1',
      price: 1.50,
      source: 'user_reported',
      scraped_at: '2026-07-17T00:00:00Z',
      notes: null,
      expires_at: '2026-07-24T00:00:00Z',
      created_at: '2026-07-17T00:00:00Z',
      stores: {
        id: 'store-1',
        name: 'Tesco Metro',
        retailer: 'tesco',
        address: 'St Patrick\'s St',
        suburb: 'Cork City',
        lat: 51.8985,
        lng: -8.4756,
      },
      products: {
        id: 'prod-1',
        name: 'Monster Ultra White',
        variant: 'ultra_white',
        size_ml: 250,
        image_url: '',
        pack_size: 'single',
      },
      ...overrides,
    }
  }

  it('filters user prices by distance', () => {
    const farPrice = makeUserPrice({
      id: 'far',
      stores: { id: 'far-store', name: 'Tesco Dublin', retailer: 'tesco', address: '', suburb: 'Dublin', lat: 53.3, lng: -6.2 },
    })
    const results = mergeUserPrices([farPrice], CORK.lat, CORK.lng, RADIUS_M)
    expect(results).toHaveLength(0)
  })

  it('includes nearby user prices', () => {
    const nearPrice = makeUserPrice()
    const results = mergeUserPrices([nearPrice], CORK.lat, CORK.lng, RADIUS_M)
    expect(results).toHaveLength(1)
    expect(results[0].price).toBe(1.50)
    expect(results[0].source).toBe('user_reported')
  })

  it('aggregates by (store_id, variant, pack_size) keeping lowest price', () => {
    const expensive = makeUserPrice({ id: 'up-2', price: 2.00 })
    const cheap = makeUserPrice({ id: 'up-1', price: 1.50 })
    const results = mergeUserPrices([expensive, cheap], CORK.lat, CORK.lng, RADIUS_M)
    expect(results).toHaveLength(1)
    expect(results[0].price).toBe(1.50)
  })

  it('uses more recent as tiebreaker for same price', () => {
    const older = makeUserPrice({ id: 'up-1', price: 1.50, created_at: '2026-07-17T00:00:00Z' })
    const newer = makeUserPrice({ id: 'up-2', price: 1.50, created_at: '2026-07-18T00:00:00Z' })
    const results = mergeUserPrices([older, newer], CORK.lat, CORK.lng, RADIUS_M)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('up-2')
  })

  it('drops user prices with null coordinates', () => {
    const badPrice = makeUserPrice({ stores: { ...makeUserPrice().stores, lat: null as unknown as number, lng: null as unknown as number } })
    const results = mergeUserPrices([badPrice], CORK.lat, CORK.lng, RADIUS_M)
    expect(results).toHaveLength(0)
  })

  it('returns empty array for no user prices', () => {
    const results = mergeUserPrices([], CORK.lat, CORK.lng, RADIUS_M)
    expect(results).toHaveLength(0)
  })
})
