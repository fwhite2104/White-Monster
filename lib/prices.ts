import type { PriceWithJoins, StoreData } from './types'
import { calculateDistance } from './geo'

export type PriceEntry = PriceWithJoins & {
  distance: number
  per_can_price?: number
  base_price?: number
  drs_deposit?: number
  clubcard_price?: number | null
  has_clubcard_pricing?: boolean
}

export interface UserPriceRecord extends PriceWithJoins {
  notes: string | null
  expires_at: string
  created_at: string
}

/** A retail location within a national-price collapse group. */
export interface StoreLocationSummary {
  id: string
  name: string
  address?: string
  suburb?: string
  lat: number
  lng: number
  distance: number
}

/**
 * Collapsed summary of one nationally-priced retailer's prices.
 * Used by the PriceList to render a single card per retailer
 * instead of N duplicate cards (one per store).
 */
export interface NationalSummary {
  retailer: string
  price: number
  nearestDistance: number
  storeCount: number
  hasClubcardPricing: boolean
  clubcardPrice: number | null
  perCanPrice?: number
  basePrice?: number
  drsDeposit?: number
  storeLocations: StoreLocationSummary[]
}

/**
 * Collapse expanded national price entries into one summary per retailer.
 * Each summary contains the nearest distance across all stores and a count
 * of how many stores the national price applies to in the user's range.
 */
export function summarizeNationalPrices(entries: PriceEntry[]): NationalSummary[] {
  const byRetailer = new Map<string, PriceEntry[]>()

  for (const entry of entries) {
    const retailer = entry.stores.retailer
    const list = byRetailer.get(retailer) ?? []
    list.push(entry)
    byRetailer.set(retailer, list)
  }

  const summaries: NationalSummary[] = []

  for (const [retailer, group] of byRetailer) {
    // Deduplicate stores by ID within the group
    const seenStores = new Map<string, StoreLocationSummary>()
    for (const entry of group) {
      const store = entry.stores
      if (seenStores.has(store.id)) continue
      seenStores.set(store.id, {
        id: store.id,
        name: store.name,
        address: store.address,
        suburb: store.suburb,
        lat: store.lat,
        lng: store.lng,
        distance: entry.distance,
      })
    }

    const storeLocations = Array.from(seenStores.values())
    const nearestDistance = Math.min(...storeLocations.map((s) => s.distance))

    // Use the first entry's price and product info
    const first = group[0]

    summaries.push({
      retailer,
      price: first.price,
      nearestDistance,
      storeCount: storeLocations.length,
      hasClubcardPricing: first.has_clubcard_pricing ?? false,
      clubcardPrice: first.clubcard_price ?? null,
      perCanPrice: first.per_can_price,
      basePrice: first.base_price,
      drsDeposit: first.drs_deposit,
      storeLocations,
    })
  }

  return summaries.sort((a, b) => a.price - b.price)
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
    (s) => {
      const lat = Number(s.lat)
      const lng = Number(s.lng)
      return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    },
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
    if (!s || !Number.isFinite(Number(s.lat)) || !Number.isFinite(Number(s.lng))) return false
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
