/**
 * Brand logo URL map for map marker icons.
 *
 * Each retailer slug (from RETAILERS in constants.ts) maps to its logo path.
 * Logos stored as local assets under public/images/brands/.
 * Use `getBrandLogo(slug)` to resolve, with a fallback for unknown slugs.
 */

const BRAND_LOGOS: Record<string, string> = {
  lidl: '/images/brands/lidl.svg',
  aldi: '/images/brands/aldi.svg',
  tesco: '/images/brands/tesco.svg',
  supervalu: '/images/brands/supervalu.svg',
  dunnes: '/images/brands/dunnes.svg',
  centra: '/images/brands/centra.svg',
  spar: '/images/brands/spar.svg',
  dealz: '/images/brands/dealz.png',
  londis: '/images/brands/londis.svg',
  costcutter: '/images/brands/costcutter.svg',
  other: '/images/brands/other.svg',
}

/** Default marker label char (first letter of retailer name) used as fallback */
export function getBrandLabel(retailerSlug: string): string {
  const labels: Record<string, string> = {
    lidl: 'L',
    aldi: 'A',
    tesco: 'T',
    supervalu: 'S',
    dunnes: 'D',
    centra: 'C',
    spar: 'S',
    dealz: 'D',
    londis: 'L',
    costcutter: 'C',
    other: '?',
  }
  return labels[retailerSlug] ?? retailerSlug.charAt(0).toUpperCase()
}

/**
 * Returns the URL path for a retailer's brand logo.
 * Most logos are SVGs; Dealz uses a PNG because no clean royalty-free SVG
 * was available. Returns empty string for unknown slugs — the caller should
 * render a coloured letter badge instead.
 */
export function getBrandLogo(retailerSlug: string): string {
  return BRAND_LOGOS[retailerSlug] ?? ''
}

/** Returns true if a brand logo SVG exists for this retailer slug. */
export function hasBrandLogo(retailerSlug: string): boolean {
  return retailerSlug in BRAND_LOGOS && BRAND_LOGOS[retailerSlug].length > 0
}

/** All retailer slugs that have brand logos. */
export const BRANDED_RETAILERS = Object.keys(BRAND_LOGOS).filter(
  (slug) => BRAND_LOGOS[slug].length > 0,
)
