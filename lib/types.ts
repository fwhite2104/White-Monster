export interface Store {
  id: string
  name: string
  retailer: string
  address?: string
  suburb?: string
  lat: number
  lng: number
  is_active: boolean
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
  source: 'scraper' | 'user_upload'
  scraped_at: string
  created_at: string
  uploaded_by_ip?: string
  notes?: string
  stores?: Store
  products?: Product
  distance?: number
  /** Price per individual can, computed from pack_size. Equal to `price` for singles, `price / 4` for 4-packs. */
  per_can_price?: number
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
