import type { Store } from '@/lib/types'

export type StoreType = 'supermarket' | 'convenience' | 'petrol_station' | 'other'
export type ConfidenceLevel = 'verified' | 'user_reported' | 'estimated'

export interface ConveniencePriceReport {
  id: string
  store_id: string
  product_id: string
  price: number
  reporter_ip: string
  confidence: ConfidenceLevel
  photo_url: string | null
  notes: string | null
  created_at: string
  expires_at: string
}

export interface StoreRegistrationRequest {
  id: string
  name: string
  retailer: string
  address: string
  suburb: string | null
  lat: number
  lng: number
  store_type: StoreType
  reporter_ip: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export const CONVENIENCE_RETAILERS = [
  { id: 'centra', name: 'Centra', color: '#FF6B00', type: 'convenience' as const },
  { id: 'spar', name: 'SPAR', color: '#E31837', type: 'convenience' as const },
  { id: 'londis', name: 'Londis', color: '#00A651', type: 'convenience' as const },
  { id: 'costcutter', name: 'Costcutter', color: '#005DA6', type: 'convenience' as const },
  { id: 'applegreen', name: 'Applegreen', color: '#00A651', type: 'petrol_station' as const },
  { id: 'maxol', name: 'Maxol', color: '#FF0000', type: 'petrol_station' as const },
] as const

export const STORE_TYPE_LABELS: Record<StoreType, string> = {
  supermarket: 'Supermarket',
  convenience: 'Convenience Store',
  petrol_station: 'Petrol Station',
  other: 'Other',
}

export function isConvenienceStore(store: Store): boolean {
  return (store as Store & { store_type?: StoreType }).store_type === 'convenience'
}

export function isPetrolStation(store: Store): boolean {
  return (store as Store & { store_type?: StoreType }).store_type === 'petrol_station'
}

export function getStoreTypeLabel(store: Store): string {
  const storeType = (store as Store & { store_type?: StoreType }).store_type
  return STORE_TYPE_LABELS[storeType ?? 'supermarket']
}

export function getRetailerColor(retailer: string): string {
  const found = CONVENIENCE_RETAILERS.find(
    (r) => r.name.toLowerCase() === retailer.toLowerCase()
  )
  return found?.color ?? '#6B7280'
}

export function isReportExpired(report: ConveniencePriceReport): boolean {
  return new Date(report.expires_at) < new Date()
}

export function getConfidenceLabel(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'verified':
      return 'Verified'
    case 'user_reported':
      return 'User Reported'
    case 'estimated':
      return 'Estimated'
  }
}

export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'verified':
      return 'text-green-400'
    case 'user_reported':
      return 'text-yellow-400'
    case 'estimated':
      return 'text-muted-foreground'
  }
}
