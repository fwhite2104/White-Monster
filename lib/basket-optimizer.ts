import type { BasketItem, BasketResult, StoreAllocation } from '@/lib/basket-types'
import { MULTI_STORE_SAVINGS_THRESHOLD } from '@/lib/basket-types'

interface PriceRow {
  id: string
  store_id: string
  product_id: string
  price: number
  distance: number
  per_can_price?: number
  stores?: { id: string; name: string; retailer: string }
  products?: { variant: string; pack_size: string }
}

function findCheapestPerItem(
  items: BasketItem[],
  prices: PriceRow[],
): Map<string, { price: number; worstPrice: number }> {
  const result = new Map<string, { price: number; worstPrice: number }>()

  for (const item of items) {
    const key = `${item.variant}:${item.pack_size}`
    const matching = prices.filter(
      (p) => p.products?.variant === item.variant && p.products?.pack_size === item.pack_size
    )

    if (matching.length === 0) {
      result.set(key, { price: Infinity, worstPrice: Infinity })
      continue
    }

    const sorted = matching.sort((a, b) => a.price - b.price)
    result.set(key, { price: sorted[0].price, worstPrice: sorted[sorted.length - 1].price })
  }

  return result
}

function buildSingleStoreAllocation(
  items: BasketItem[],
  prices: PriceRow[],
): StoreAllocation | null {
  const storeScores = new Map<string, { store: { id: string; name: string; retailer: string }; total: number; distance: number; items: StoreAllocation['items'] }>()

  for (const item of items) {
    const matching = prices.filter(
      (p) => p.products?.variant === item.variant && p.products?.pack_size === item.pack_size
    )

    for (const price of matching) {
      const storeId = price.store_id
      if (!storeScores.has(storeId)) {
        storeScores.set(storeId, {
          store: price.stores!,
          total: 0,
          distance: price.distance,
          items: [],
        })
      }

      const store = storeScores.get(storeId)!
      store.total += price.price * item.quantity
      store.items.push({
        variant: item.variant,
        pack_size: item.pack_size,
        price: price.price,
        quantity: item.quantity,
      })
    }
  }

  if (storeScores.size === 0) return null

  const sorted = Array.from(storeScores.values()).sort((a, b) => a.total - b.total)
  const best = sorted[0]

  return {
    store_id: best.store.id,
    store_name: best.store.name,
    retailer: best.store.retailer,
    items: best.items,
    subtotal: Number(best.total.toFixed(2)),
    distance: best.distance,
  }
}

function buildMultiStoreAllocations(
  items: BasketItem[],
  prices: PriceRow[],
): StoreAllocation[] {
  const allocations: StoreAllocation[] = []
  const usedStores = new Set<string>()

  for (const item of items) {
    const matching = prices
      .filter(
        (p) => p.products?.variant === item.variant && p.products?.pack_size === item.pack_size
      )
      .sort((a, b) => a.price - b.price)

    if (matching.length === 0) continue

    let bestPrice = matching[0]

    for (const price of matching) {
      if (usedStores.has(price.store_id)) {
        bestPrice = price
        break
      }
    }

    let allocation = allocations.find((a) => a.store_id === bestPrice.store_id)
    if (!allocation) {
      allocation = {
        store_id: bestPrice.store_id,
        store_name: bestPrice.stores?.name ?? 'Unknown',
        retailer: bestPrice.stores?.retailer ?? 'other',
        items: [],
        subtotal: 0,
        distance: bestPrice.distance,
      }
      allocations.push(allocation)
      usedStores.add(bestPrice.store_id)
    }

    allocation.items.push({
      variant: item.variant,
      pack_size: item.pack_size,
      price: bestPrice.price,
      quantity: item.quantity,
    })
    allocation.subtotal += bestPrice.price * item.quantity
  }

  return allocations.map((a) => ({ ...a, subtotal: Number(a.subtotal.toFixed(2)) }))
}

export function optimiseBasket(
  items: BasketItem[],
  prices: PriceRow[],
): BasketResult {
  if (items.length === 0 || prices.length === 0) {
    return {
      allocations: [],
      total_cost: 0,
      total_savings: 0,
      worst_case_cost: 0,
      stores_to_visit: 0,
      single_store_cost: 0,
      recommendation: 'single',
    }
  }

  const cheapestPerItem = findCheapestPerItem(items, prices)

  let totalWorst = 0
  for (const item of items) {
    const key = `${item.variant}:${item.pack_size}`
    const info = cheapestPerItem.get(key)
    if (info && info.worstPrice !== Infinity) {
      totalWorst += info.worstPrice * item.quantity
    }
  }

  const singleStore = buildSingleStoreAllocation(items, prices)
  const multiStores = buildMultiStoreAllocations(items, prices)

  const singleCost = singleStore?.subtotal ?? Infinity
  const multiCost = multiStores.reduce((sum, a) => sum + a.subtotal, 0)

  const savings = totalWorst - Math.min(singleCost, multiCost)
  const useMulti = multiStores.length > 1 && (singleCost - multiCost) > MULTI_STORE_SAVINGS_THRESHOLD

  if (useMulti) {
    return {
      allocations: multiStores,
      total_cost: multiCost,
      total_savings: Number(savings.toFixed(2)),
      worst_case_cost: Number(totalWorst.toFixed(2)),
      stores_to_visit: multiStores.length,
      single_store_cost: singleCost,
      recommendation: 'multi',
    }
  }

  return {
    allocations: singleStore ? [singleStore] : [],
    total_cost: singleCost === Infinity ? 0 : singleCost,
    total_savings: singleCost === Infinity ? 0 : Number(savings.toFixed(2)),
    worst_case_cost: Number(totalWorst.toFixed(2)),
    stores_to_visit: singleStore ? 1 : 0,
    single_store_cost: singleCost === Infinity ? 0 : singleCost,
    recommendation: 'single',
  }
}
