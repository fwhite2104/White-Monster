export interface Deal {
  id: string
  retailer: string
  title: string
  description: string | null
  deal_type: 'multi_buy' | 'clubcard' | 'loyalty' | 'clearance' | 'bundle'
  original_price: number
  deal_price: number
  savings_amount: number
  savings_percent: number
  min_quantity: number
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
  products?: Array<{ id: string; name: string; variant: string; pack_size: string }>
}

export interface DealWithProducts extends Deal {
  products: Array<{ id: string; name: string; variant: string; pack_size: string }>
}

export function getDaysRemaining(validUntil: string): number {
  const now = new Date()
  const end = new Date(validUntil)
  const diffMs = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

export function getHoursRemaining(validUntil: string): number {
  const now = new Date()
  const end = new Date(validUntil)
  const diffMs = end.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)))
}

export function isExpiringSoon(validUntil: string, thresholdHours = 48): boolean {
  return getHoursRemaining(validUntil) <= thresholdHours
}

export function isDealActive(deal: { valid_from: string; valid_until: string; is_active: boolean }): boolean {
  if (!deal.is_active) return false
  const now = new Date()
  const from = new Date(deal.valid_from)
  const until = new Date(deal.valid_until)
  return now >= from && now <= until
}

export function formatDealSaving(savingsPercent: number): string {
  return `${savingsPercent}% OFF`
}

export function formatDealPrice(dealPrice: number, originalPrice: number): string {
  return `€${dealPrice.toFixed(2)} (was €${originalPrice.toFixed(2)})`
}

export const DEAL_TYPE_LABELS: Record<string, string> = {
  multi_buy: 'Multi-buy',
  clubcard: 'Clubcard',
  loyalty: 'Loyalty',
  clearance: 'Clearance',
  bundle: 'Bundle',
}

export const DEAL_TYPE_COLORS: Record<string, string> = {
  multi_buy: 'bg-orange-500/15 text-orange-400',
  clubcard: 'bg-blue-500/15 text-blue-400',
  loyalty: 'bg-purple-500/15 text-purple-400',
  clearance: 'bg-red-500/15 text-red-400',
  bundle: 'bg-green-500/15 text-green-400',
}
