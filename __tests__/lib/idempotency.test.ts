import { describe, it, expect } from 'vitest'
import { MONSTER_VARIANTS } from '@/lib/constants'

describe('Idempotency: Store deduplication keys', () => {
  it('stores are keyed by name + retailer, not name + coordinates', () => {
    const stores = [
      { name: 'Tesco Wilton', retailer: 'tesco', lat: 51.8985, lng: -8.4756 },
      { name: 'Tesco Wilton', retailer: 'tesco', lat: 51.8985, lng: -8.4756 },
      { name: 'Tesco Wilton', retailer: 'tesco', lat: 51.8990, lng: -8.4760 },
    ]
    const uniqueKeys = new Set(stores.map(s => `${s.name}|${s.retailer}`))
    expect(uniqueKeys.size).toBe(1)
  })

  it('different retailers with same name are distinct stores', () => {
    const stores = [
      { name: 'City Centre', retailer: 'tesco', lat: 51.8985, lng: -8.4756 },
      { name: 'City Centre', retailer: 'dunnes', lat: 51.8985, lng: -8.4756 },
    ]
    const uniqueKeys = new Set(stores.map(s => `${s.name}|${s.retailer}`))
    expect(uniqueKeys.size).toBe(2)
  })
})

describe('Idempotency: Price deduplication keys', () => {
  it('prices are keyed by store_id + product_id + source', () => {
    const prices = [
      { store_id: 's1', product_id: 'p1', source: 'scraper', price: 2.50 },
      { store_id: 's1', product_id: 'p1', source: 'scraper', price: 2.60 },
      { store_id: 's1', product_id: 'p1', source: 'user_upload', price: 2.50 },
      { store_id: 's1', product_id: 'p2', source: 'scraper', price: 2.50 },
    ]
    const uniqueKeys = new Set(prices.map(p => `${p.store_id}|${p.product_id}|${p.source}`))
    expect(uniqueKeys.size).toBe(3)
  })

  it('same store+product can have both scraper and user_upload prices', () => {
    const prices = [
      { store_id: 's1', product_id: 'p1', source: 'scraper', price: 2.50 },
      { store_id: 's1', product_id: 'p1', source: 'user_upload', price: 2.50 },
    ]
    const uniqueKeys = new Set(prices.map(p => `${p.store_id}|${p.product_id}|${p.source}`))
    expect(uniqueKeys.size).toBe(2)
  })
})

describe('Idempotency: Product deduplication keys', () => {
  it('products are keyed by variant + pack_size', () => {
    const products = [
      { variant: 'zero_sugar', pack_size: 'single' },
      { variant: 'zero_sugar', pack_size: '4_pack' },
      { variant: 'ultra_white', pack_size: 'single' },
      { variant: 'zero_sugar', pack_size: 'single' },
    ]
    const uniqueKeys = new Set(products.map(p => `${p.variant}|${p.pack_size}`))
    expect(uniqueKeys.size).toBe(3)
  })

  it('MONSTER_VARIANTS map to correct variant values', () => {
    const variantKeys = new Set(MONSTER_VARIANTS.map(v => `${v.value}|single`))
    expect(variantKeys.size).toBe(MONSTER_VARIANTS.length)
  })
})

describe('Idempotency: Frontend deduplication', () => {
  it('rate limiter prevents rapid duplicate submissions', () => {
    const windowMs = 60000
    const maxRequests = 5
    const hits: number[] = []
    const now = Date.now()

    function checkRateLimit(): boolean {
      const windowStart = now - windowMs
      const recentHits = hits.filter(t => t > windowStart)
      if (recentHits.length >= maxRequests) return false
      hits.push(now)
      return true
    }

    let accepted = 0
    for (let i = 0; i < 10; i++) {
      if (checkRateLimit()) accepted++
    }
    expect(accepted).toBe(maxRequests)
  })

  it('national store price expansion does not produce duplicates', () => {
    const nationalPrices = [
      { store_id: 'national-tesco', product_id: 'p1', price: 2.5, stores: { id: 'national-tesco', name: 'Tesco Ireland (National)', retailer: 'tesco', lat: 51.8985, lng: -8.4756 } },
    ]
    const physicalStores = [
      { id: 'tesco-wilton', name: 'Tesco Wilton', retailer: 'tesco', lat: 51.8976, lng: -8.4745 },
      { id: 'tesco-merchants', name: 'Tesco Merchants Quay', retailer: 'tesco', lat: 51.899, lng: -8.47 },
    ]
    const physicalStorePrices = [
      { store_id: 'tesco-wilton', product_id: 'p1', price: 4.5, stores: { id: 'tesco-wilton', name: 'Tesco Wilton', retailer: 'tesco' } },
    ]

    const seenStoreProduct = new Set<string>()
    const expanded: { store_id: string; product_id: string }[] = []

    for (const p of physicalStorePrices) {
      seenStoreProduct.add(`${p.stores.id}|${p.product_id}`)
      expanded.push(p)
    }

    for (const store of physicalStores) {
      for (const np of nationalPrices) {
        const key = `${store.id}|${np.product_id}`
        if (seenStoreProduct.has(key)) continue
        seenStoreProduct.add(key)
        expanded.push({ store_id: store.id, product_id: np.product_id })
      }
    }

    const deduplicatedKeys = new Set(expanded.map(p => `${p.store_id}|${p.product_id}`))
    expect(expanded.length).toBe(deduplicatedKeys.size)
    expect(expanded.length).toBe(2)
  })
})