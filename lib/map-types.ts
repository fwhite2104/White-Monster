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

export interface Coord {
  lat: number
  lng: number
}

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
  type: string
}
