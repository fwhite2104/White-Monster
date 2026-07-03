export const CORK_CENTER = { lat: 51.8985, lng: -8.4756 }

export const RETAILERS = [
  { value: 'lidl', label: 'Lidl', color: '#0050AA' },
  { value: 'aldi', label: 'Aldi', color: '#00247D' },
  { value: 'tesco', label: 'Tesco', color: '#EE1C2E' },
  { value: 'supervalu', label: 'SuperValu', color: '#F47920' },
  { value: 'dunnes', label: 'Dunnes Stores', color: '#006633' },
  { value: 'centra', label: 'Centra', color: '#F26522' },
  { value: 'spar', label: 'Spar', color: '#E31837' },
  { value: 'dealz', label: 'Dealz', color: '#E60000' },
  { value: 'londis', label: 'Londis', color: '#0055A4' },
  { value: 'costcutter', label: 'Costcutter', color: '#009639' },
  { value: 'other', label: 'Other', color: '#6B7280' },
]

export const MONSTER_VARIANTS = [
  { value: 'zero_sugar', label: 'White Monster Zero Sugar', size: 250, category: 'zero_sugar' },
  { value: 'ultra_white', label: 'Monster Ultra White', size: 250, category: 'zero_sugar' },
  { value: 'original', label: 'Monster Energy Original', size: 500, category: 'full_sugar' },
  { value: 'ultra_rosa', label: 'Monster Ultra Rosa', size: 250, category: 'zero_sugar' },
  { value: 'ultra_paradise', label: 'Monster Ultra Paradise', size: 250, category: 'zero_sugar' },
  { value: 'ultra_gold', label: 'Monster Ultra Gold', size: 250, category: 'zero_sugar' },
  { value: 'ultra_violet', label: 'Monster Ultra Violet', size: 250, category: 'zero_sugar' },
  { value: 'ultra_peachy_keen', label: 'Monster Ultra Peachy Keen', size: 250, category: 'zero_sugar' },
  { value: 'lando_norris', label: 'Monster Lando Norris Zero Sugar', size: 250, category: 'zero_sugar' },
  { value: 'mango_loco', label: 'Monster Mango Loco', size: 500, category: 'full_sugar' },
  { value: 'pipeline_punch', label: 'Monster Pipeline Punch', size: 500, category: 'full_sugar' },
  { value: 'rio_punch', label: 'Monster Rio Punch', size: 500, category: 'full_sugar' },
  { value: 'monarch', label: 'Monster Monarch', size: 500, category: 'full_sugar' },
  { value: 'the_doctor', label: 'Monster The Doctor', size: 500, category: 'full_sugar' },
  { value: 'pacific_punch', label: 'Monster Pacific Punch', size: 500, category: 'full_sugar' },
  { value: 'assault', label: 'Monster Assault', size: 500, category: 'full_sugar' },
  { value: 'khaotic', label: 'Monster Khaotic', size: 500, category: 'full_sugar' },
  { value: 'viking_berry', label: 'Monster Viking Berry', size: 250, category: 'full_sugar' },
  { value: 'juice_monster_apple', label: 'Monster Juice Monster Apple', size: 500, category: 'full_sugar' },
  { value: 'hydro_watermelon', label: 'Monster Hydro Watermelon', size: 550, category: 'hydro_rehab' },
  { value: 'rehab_lemon_tea', label: 'Monster Rehab Lemon Tea', size: 500, category: 'hydro_rehab' },
  { value: 'rehab_green_tea', label: 'Monster Rehab Green Tea', size: 500, category: 'hydro_rehab' },
]

export const DEFAULT_RADIUS_KM = 10
export const MAX_RADIUS_KM = 50
export const MIN_RADIUS_KM = 1

/** Default filter values for initial state and reset. */
export const DEFAULT_FILTERS = {
  sort: 'price',
  variant: 'zero_sugar',
  packSize: '4_pack',
  radius: DEFAULT_RADIUS_KM,
} as const

/** Max age for a cached GPS fix before auto-refresh silently re-requests. 20 minutes. */
export const LOCATION_MAX_AGE_MS = 20 * 60 * 1000

/** All supported pack sizes. Defined once and used by API validation, filters, and forms. */
export const PACK_SIZES = ['single', '4_pack', '6_pack', '8_pack', '10_pack', '12_pack', '24_pack'] as const
export type PackSize = (typeof PACK_SIZES)[number]

/**
 * Parse the numeric can count from a pack_size string.
 * 'single' → 1, '4_pack' → 4, '6_pack' → 6, '12_pack' → 12, etc.
 * Falls back to 1 for unrecognized values.
 */
export function getPackCount(packSize: string): number {
  if (packSize === 'single') return 1
  const match = packSize.match(/^(\d+)_pack$/)
  return match ? parseInt(match[1], 10) : 1
}

/**
 * Format a pack_size value for human-readable display.
 * 'single' → 'Single can', '4_pack' → '4-Pack', '6_pack' → '6-Pack'.
 */
export function formatPackSize(packSize: string): string {
  if (packSize === 'single') return 'Single can'
  const match = packSize.match(/^(\d+)_pack$/)
  return match ? `${match[1]}-Pack` : packSize
}

export function getRetailerColor(retailer: string): string {
  const found = RETAILERS.find((r) => r.value === retailer.toLowerCase())
  return found?.color ?? '#6B7280'
}
