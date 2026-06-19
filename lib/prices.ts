import type { PriceWithJoins, StoreData } from './types'
import { calculateDistance } from './geo'

export type PriceEntry = PriceWithJoins & { distance: number }

export interface UserPriceRecord extends PriceWithJoins {
  notes: string | null
  expires_at: string
  created_at: string
}

/**
 * Expand national (centralized) prices to physical store locations within radius.
 * For each retailer's national prices, finds matching physical stores in range
 * and creates price entries for each store. Falls back to national store entries
 * if no physical stores are found for a retailer.
 */
export function expandNationalPrices(
  nationalPrices: PriceWithJoins[],
  allStores: StoreData[],
  lat: number,
  lng: number,
  radiusMeters: number,
  existingResults: PriceEntry[],
): PriceEntry[] {
  const validStores = allStores.filter(
    (s) =>
      Number.isFinite(s.lat) &&
      Number.isFinite(s.lng) &&
      s.lat >= -90 &&
      s.lat <= 90 &&
      s.lng >= -180 &&
      s.lng <= 180,
  )
  const physicalStores = validStores.filter((s) => !s.name.includes('(National)'))
  const nationalStores = validStores.filter((s) => s.name.includes('(National)'))

  const storeByRetailer = new Map<string, typeof physicalStores>()
  for (const s of physicalStores) {
    const list = storeByRetailer.get(s.retailer) ?? []
    list.push(s)
    storeByRetailer.set(s.retailer, list)
  }

  const nationalByRetailer = new Map<string, PriceWithJoins[]>()
  for (const p of nationalPrices) {
    const list = nationalByRetailer.get(p.stores.retailer) ?? []
    list.push(p)
    nationalByRetailer.set(p.stores.retailer, list)
  }

  const results: PriceEntry[] = []
  const seenStoreProduct = new Set<string>()
  for (const p of existingResults) {
    seenStoreProduct.add(`${p.stores.id}|${p.product_id}`)
  }

  for (const [retailer, nPrices] of nationalByRetailer) {
    const retailerStores = (storeByRetailer.get(retailer) ?? []).filter(
      (s) => calculateDistance(lat, lng, s.lat, s.lng) <= radiusMeters,
    )

    if (retailerStores.length === 0) {
      const fallbackStore = nationalStores.find((s) => s.retailer === retailer)
      if (fallbackStore) {
        const dist = calculateDistance(lat, lng, fallbackStore.lat, fallbackStore.lng)
        for (const np of nPrices) {
          results.push({ ...np, distance: dist })
        }
      }
      continue
    }

    for (const store of retailerStores) {
      for (const np of nPrices) {
        const key = `${store.id}|${np.product_id}`
        if (seenStoreProduct.has(key)) continue
        seenStoreProduct.add(key)

        const dist = calculateDistance(lat, lng, store.lat, store.lng)
        results.push({
          ...np,
          store_id: store.id,
          stores: {
            id: store.id,
            name: store.name,
            retailer: store.retailer,
            address: store.address ?? '',
            suburb: store.suburb ?? '',
            lat: store.lat,
            lng: store.lng,
          },
          distance: dist,
        })
      }
    }
  }

  return results
}

/**
 * Merge user-reported prices into results.
 * Filters by distance, aggregates by (retailer, variant, pack_size)
 * keeping lowest price (most recent as tiebreaker), and returns
 * new PriceEntry items to append to results.
 */
export function mergeUserPrices(
  userPrices: UserPriceRecord[],
  lat: number,
  lng: number,
  radiusMeters: number,
): PriceEntry[] {
  // Filter by distance to user
  const nearbyUserPrices = userPrices.filter((up) => {
    const s = up.stores
    if (!s || !Number.isFinite(s.lat) || !Number.isFinite(s.lng)) return false
    const dist = calculateDistance(lat, lng, s.lat, s.lng)
    return dist <= radiusMeters
  })

  // Aggregate by (store_id, variant, pack_size): lowest price, most recent as tiebreaker
  const bestByRetailer = new Map<string, UserPriceRecord>()
  for (const up of nearbyUserPrices) {
    const key = `${up.store_id}|${up.products.variant}|${up.products.pack_size}`
    const existing = bestByRetailer.get(key)
    if (
      !existing ||
      Number(up.price) < Number(existing.price) ||
      (Number(up.price) === Number(existing.price) &&
        new Date(up.created_at) > new Date(existing.created_at))
    ) {
      bestByRetailer.set(key, up)
    }
  }

  // Convert best user-reported prices to PriceEntry items
  const results: PriceEntry[] = []
  for (const up of bestByRetailer.values()) {
    const dist = calculateDistance(lat, lng, up.stores.lat, up.stores.lng)
    results.push({
      id: up.id,
      store_id: up.store_id,
      product_id: up.product_id,
      price: Number(up.price),
      source: 'user_reported',
      scraped_at: up.created_at,
      stores: up.stores,
      products: up.products,
      distance: dist,
    })
  }

  return results
}
