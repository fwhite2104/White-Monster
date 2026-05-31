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
}

export interface PriceWithDistance extends Price {
  distance: number
}

export interface StoreWithDistance extends Store {
  distance: number
}
