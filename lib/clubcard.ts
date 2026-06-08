// lib/clubcard.ts — Tesco Clubcard pricing logic

/**
 * Tesco Ireland retailer identifier (used across the app).
 */
const TESCO_RETAILER = 'tesco'

/**
 * Calculate the Clubcard saving amount.
 */
export function calculateClubcardSaving(
  standardPrice: number,
  clubcardPrice: number,
): number {
  return Number((standardPrice - clubcardPrice).toFixed(2))
}

/**
 * Calculate the Clubcard saving percentage.
 */
export function calculateClubcardSavingPercent(
  standardPrice: number,
  clubcardPrice: number,
): number {
  if (standardPrice <= 0) return 0
  const saving = standardPrice - clubcardPrice
  return Number(((saving / standardPrice) * 100).toFixed(0))
}

/**
 * Check if a store is Tesco (supports Clubcard pricing).
 */
export function isTescoRetailer(retailer: string): boolean {
  return retailer.toLowerCase() === TESCO_RETAILER
}

/**
 * Get the effective price based on Clubcard preference.
 * If user has Clubcard and the price has Clubcard pricing, return Clubcard price.
 * Otherwise, return the standard price.
 */
export function getEffectivePrice(
  price: number,
  clubcardPrice: number | null | undefined,
  isClubcardHolder: boolean,
): number {
  if (isClubcardHolder && clubcardPrice !== null && clubcardPrice !== undefined) {
    return clubcardPrice
  }
  return price
}

/**
 * Format the Clubcard price string.
 */
export function formatClubcardPrice(clubcardPrice: number): string {
  return `€${clubcardPrice.toFixed(2)}`
}

/**
 * Format the saving display (e.g., "Save €1.85 (23%)").
 */
export function formatClubcardSaving(
  standardPrice: number,
  clubcardPrice: number,
): string {
  const saving = calculateClubcardSaving(standardPrice, clubcardPrice)
  const percent = calculateClubcardSavingPercent(standardPrice, clubcardPrice)
  return `Save €${saving.toFixed(2)} (${percent}%)`
}

export const CLUBCARD_INFO = {
  schemeName: 'Tesco Clubcard',
  description:
    'Tesco Clubcard offers exclusive prices that are 15-25% lower than standard prices. Free to join in-store or online.',
  howToGet: 'Sign up for free at Tesco.ie or in-store with your phone number.',
  applicableStores: 'Tesco Ireland stores only',
} as const
