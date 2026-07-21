export interface Place {
  id: string
  name: string
  lat: number
  lng: number
  category: string
  subcategory: string
  address?: string
  phone?: string
}

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
  type: string
}
