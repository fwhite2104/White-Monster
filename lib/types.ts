export interface Store {
  id: string
  name: string
  retailer: string
  address?: string
  suburb?: string
  lat: number
  lng: number
  is_active: boolean
  store_type?: 'supermarket' | 'convenience' | 'petrol_station' | 'other'
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  variant: string
  size_ml: number
  barcode?: string
  image_url?: string
  pack_size: string
  is_active: boolean
  created_at: string
}

export interface Price {
  id: string
  store_id: string
  product_id: string
  price: number
  source: 'scraper' | 'user_upload' | 'user_reported'
  scraped_at: string
  created_at: string
  uploaded_by_ip?: string
  notes?: string
  stores?: Store
  products?: Product
  distance?: number
  /** Price per individual can, computed from pack_size. Equal to `price` for singles, `price / 4` for 4-packs. */
  per_can_price?: number
  /** DRS deposit included in the displayed price. €0.15 per 250ml can. */
  drs_deposit?: number
  /** Product price excluding the refundable DRS deposit. */
  base_price?: number
  /** Clubcard price at Tesco (null if not Tesco or no Clubcard pricing). */
  clubcard_price?: number | null
  /** Whether this price entry has Clubcard pricing available. */
  has_clubcard_pricing?: boolean
}

export interface PriceWithDistance extends Price {
  distance: number
}

export interface StoreWithDistance extends Store {
  distance: number
}

export interface UserPrice {
  id: string
  store_id: string
  product_id: string
  price: number
  uploaded_by_ip?: string
  notes?: string
  expires_at: string
  created_at: string
  stores?: Store
  products?: Product
}

export interface StoreData {
  id: string
  name: string
  retailer: string
  address: string
  suburb: string
  lat: number
  lng: number
}

export interface ProductData {
  id: string
  name: string
  variant: string
  size_ml: number
  image_url: string
  pack_size: string
}

export interface PriceWithJoins {
  id: string
  store_id: string
  product_id: string
  price: number
  source: string
  scraped_at: string
  stores: StoreData
  products: ProductData
}

export interface UserFavorite {
  id: string
  session_id: string
  product_id: string
  store_id: string | null
  notes: string | null
  created_at: string
  products?: Product
  stores?: Store
}
