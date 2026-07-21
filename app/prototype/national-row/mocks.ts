// PROTOTYPE mocks — throwaway. lat: 0, lng: 0 is the "null coord" signal (matches createNationalPriceFromSummary's existing convention).

import type { Price, Product } from "@/lib/types"

export const mockProduct: Product = {
  id: "prod-zero-sugar",
  name: "Monster Energy Zero Sugar",
  variant: "zero_sugar",
  size_ml: 250,
  barcode: "5060485340222",
  pack_size: "4_pack",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
}

// National anchor row AS IT IS TODAY: Cork coords, suburb "Cork City", distance 0 (user at Cork center).
// This is the misleading presentation we're fixing — the row appears as a Cork physical store.
export const mockNationalCurrent: Price = {
  id: "price-tesco-national-current",
  store_id: "store-tesco-national",
  product_id: mockProduct.id,
  price: 6.5,
  source: "scraper",
  scraped_at: "2026-07-21T09:00:00Z",
  created_at: "2026-07-21T09:00:00Z",
  per_can_price: 1.625,
  distance: 0,
  stores: {
    id: "store-tesco-national",
    name: "Tesco Ireland (National)",
    retailer: "tesco",
    suburb: "Cork City",
    address: "",
    lat: 51.899,
    lng: -8.476,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  products: mockProduct,
}

// National anchor row POST-UPDATE: null coords (0,0), suburb "Ireland (national)", distance 0.
// This is what the build will surface after the DROP NOT NULL migration + scraper retag.
export const mockNationalPostUpdate: Price = {
  ...mockNationalCurrent,
  id: "price-tesco-national-postupdate",
  stores: {
    ...mockNationalCurrent.stores!,
    id: "store-tesco-national-postupdate",
    suburb: "Ireland (national)",
    lat: 0,
    lng: 0,
  },
}

// A physical Tesco in radius — the build hides the national row when this exists.
export const mockPhysical: Price = {
  id: "price-tesco-physical",
  store_id: "store-tesco-cork-city",
  product_id: mockProduct.id,
  price: 6.0,
  source: "scraper",
  scraped_at: "2026-07-21T09:00:00Z",
  created_at: "2026-07-21T09:00:00Z",
  per_can_price: 1.5,
  distance: 1200,
  stores: {
    id: "store-tesco-cork-city",
    name: "Tesco Cork City",
    retailer: "tesco",
    suburb: "Cork City",
    address: "86 Winthrop St, Centre",
    lat: 51.8978,
    lng: -8.4709,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  products: mockProduct,
}