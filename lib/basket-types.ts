export interface BasketItem {
  variant: string
  pack_size: 'single' | '4_pack'
  quantity: number
}

export interface StoreAllocation {
  store_id: string
  store_name: string
  retailer: string
  items: Array<{ variant: string; pack_size: string; price: number; quantity: number }>
  subtotal: number
  distance: number
}

export interface BasketResult {
  allocations: StoreAllocation[]
  total_cost: number
  total_savings: number
  worst_case_cost: number
  stores_to_visit: number
  single_store_cost: number
  recommendation: 'single' | 'multi'
}

export interface BasketRequest {
  items: BasketItem[]
  lat: number
  lng: number
  radius: number
}

export const MAX_BASKET_ITEMS = 10
export const MULTI_STORE_SAVINGS_THRESHOLD = 1.50
export const MAX_STORES_TO_VISIT = 3
