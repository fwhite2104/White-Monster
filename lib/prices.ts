import type { PriceWithJoins, StoreData, ProductData } from './types'
import type { Price } from './types'
import { calculateDistance } from './geo'
import { getPackCount } from './constants'
import { splitPrice } from './drs'

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

/**
 * Computed fields that are derived from raw price data.
 * Shared by enrichPrice() to avoid duplication across mapping sites.
 */
export interface EnrichedPriceFields {
  per_can_price: number
  base_price: number
  drs_deposit: number
  clubcard_price: number | null
  has_clubcard_pricing: boolean
}

/**
 * Compute all derived price fields from raw inputs.
 * Used in three places (RPC results, national expansion, user prices) —
 * this is the single source of truth for the mapping.
 */
export function enrichPrice(
  price: number,
  packSize: string,
  retailer: string,
  clubcardPrice?: number | null,
): EnrichedPriceFields {
  const totalPrice = Number(price)
  const packCount = getPackCount(packSize)
  const perCanPrice = packCount > 1 ? totalPrice / packCount : totalPrice
  const { base_price, drs_deposit } = splitPrice(totalPrice, packSize)
  const cp = clubcardPrice ?? null
  const hasClubcardPricing = retailer === 'tesco' && cp !== null

  return {
    per_can_price: perCanPrice,
    base_price,
    drs_deposit,
    clubcard_price: cp,
    has_clubcard_pricing: hasClubcardPricing,
  }
}

/** A retail location within a national-price collapse group. */
export interface StoreLocationSummary {
  id: string
  name: string
  address?: string
  suburb?: string
  lat: number | null
  lng: number | null
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
  nearest_distance: number
  store_count: number
  has_clubcard_pricing: boolean
  clubcard_price: number | null
  per_can_price?: number
  base_price?: number
  drs_deposit?: number
  products: ProductData
  store_locations: StoreLocationSummary[]
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
      nearest_distance: nearestDistance,
      store_count: storeLocations.length,
      has_clubcard_pricing: first.has_clubcard_pricing ?? false,
      clubcard_price: first.clubcard_price ?? null,
      per_can_price: first.per_can_price,
      base_price: first.base_price,
      drs_deposit: first.drs_deposit,
      products: first.products,
      store_locations: storeLocations,
    })
  }

  return summaries.sort((a, b) => a.price - b.price)
}

export function createNationalPriceFromSummary(summary: NationalSummary): Price {
  const retailerLabel = summary.retailer.charAt(0).toUpperCase() + summary.retailer.slice(1)
  return {
    id: summary.retailer,
    store_id: summary.retailer,
    product_id: summary.products.id,
    price: summary.price,
    source: 'scraper',
    scraped_at: '',
    created_at: '',
    distance: summary.nearest_distance,
    per_can_price: summary.per_can_price,
    base_price: summary.base_price,
    drs_deposit: summary.drs_deposit,
    clubcard_price: summary.clubcard_price,
    has_clubcard_pricing: summary.has_clubcard_pricing,
    stores: {
      id: summary.retailer,
      name: retailerLabel,
      retailer: summary.retailer,
      address: '',
      suburb: '',
      lat: 0,
      lng: 0,
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    products: { ...summary.products, is_active: true, created_at: '' },
  }
}

export function computeBestPrice(prices: Price[], summaries: NationalSummary[]): Price | null {
  if (prices.length === 0 && summaries.length === 0) return null

  const cheapestPrice = prices.length > 0
    ? [...prices].sort((a, b) => Number(a.price) - Number(b.price))[0]
    : null
  const cheapestSummary = summaries.length > 0
    ? [...summaries].sort((a, b) => Number(a.price) - Number(b.price))[0]
    : null

  if (!cheapestPrice && cheapestSummary) return createNationalPriceFromSummary(cheapestSummary)
  if (!cheapestSummary) return cheapestPrice

  return Number(cheapestPrice!.price) <= Number(cheapestSummary.price)
    ? cheapestPrice
    : createNationalPriceFromSummary(cheapestSummary)
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
  const physicalStores = allStores.filter(
    (s): s is StoreData & { lat: number; lng: number } => {
      if (s.name.includes('(National)')) return false
      if (s.lat === null || s.lng === null) return false
      const nLat = s.lat
      const nLng = s.lng
      return Number.isFinite(nLat) && Number.isFinite(nLng)
        && nLat >= -90 && nLat <= 90 && nLng >= -180 && nLng <= 180
    },
  )
  const nationalStores = allStores.filter((s) => s.name.includes('(National)'))

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
        const dist = fallbackStore.lat !== null && fallbackStore.lng !== null
          ? calculateDistance(lat, lng, fallbackStore.lat, fallbackStore.lng)
          : Infinity
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
  const nearbyUserPrices = userPrices.filter(
    (up): up is UserPriceRecord & { stores: StoreData & { lat: number; lng: number } } => {
      const s = up.stores
      if (!s || s.lat === null || s.lng === null) return false
      if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) return false
      return calculateDistance(lat, lng, s.lat, s.lng) <= radiusMeters
    },
  )

  // Aggregate by (store_id, variant, pack_size): lowest price, most recent as tiebreaker
  type NearbyUserPrice = UserPriceRecord & { stores: StoreData & { lat: number; lng: number } }
  const bestByRetailer = new Map<string, NearbyUserPrice>()
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
