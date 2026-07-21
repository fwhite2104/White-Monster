# ADR-0002: National Pricing Model with Query-Time Store Expansion

**Status**: Accepted  
**Date**: 2026-07-20  
**Driver**: Avoid storing redundant price rows for every physical store when most Irish retailers set prices centrally.

## Context

The app tracks prices across 11 Irish retailers. For Aldi and Lidl, prices are store-specific and each physical location has its own `stores` row. For Tesco, Dunnes, SuperValu, and most convenience chains, prices are set nationally — every store in the chain charges the same amount on the same day. Storing one price row per physical store would create hundreds of nearly identical rows per product and force every scraper update to touch every store.

Options considered:

1. **One price per store** — accurate per-location, but hugely redundant for national retailers and expensive to scrape/upsert.
2. **Write-time expansion** — insert a price row for every physical store when the national price changes. Simple to query, but data goes stale as stores open/close and requires bulk writes.
3. **Query-time expansion** — store a single price per `(retailer, product)` linked to a national placeholder store, then fan it out to physical stores inside the API request.

## Decision

Store one price per `(retailer, product)` using a `(National)` placeholder store. Expand those national prices to physical store locations at query time via `expandNationalPrices()` in `lib/prices.ts`. Collapse the expanded entries back into one card per retailer for the price list via `summarizeNationalPrices()`, while keeping the full expanded entries for the map. If no physical store of a retailer exists within the user's radius, fall back to the national placeholder entry itself.

## Rationale

- **Storage efficiency**: A single row per `(retailer, product)` replaces potentially hundreds of identical rows.
- **Scraper simplicity**: National scrapers only need one `store_id` to attach prices to; they do not need to know every store location.
- **Map support**: Physical store locations (seeded from Overpass or SQL) are matched to national prices at query time, so map pins still show per-store prices.
- **List clarity**: `summarizeNationalPrices()` prevents the UI from rendering dozens of identical cards for the same retailer.

## Trade-offs

- **Query-time fan-out adds latency and CPU** versus a plain table read. The expansion is bounded by the number of retailers and stores in radius, so it remains small.
- **`(National)` naming convention is a string hack**, not a proper boolean `is_national` column. It works but is brittle and harder to index.
- **Distance nuance is hidden in the list view**: the summary shows the nearest store distance and store count, not per-store distances.
- **Unique constraint complexity**: the `prices` table enforces `UNIQUE (store_id, product_id, source)`, which is fine for national placeholders but requires careful handling when user-reported prices enter the mix.

## Consequences

- `prices` stores national prices against stores whose `name` contains `(National)`.
- `app/api/prices/route.ts` fetches physical-store prices via `nearby_prices`, then separately queries national prices and passes them to `expandNationalPrices()`.
- `expandNationalPrices()` filters physical stores by `!s.name.includes('(National)')` and falls back to national stores when no physical store of a retailer is in range.
- `summarizeNationalPrices()` produces one `NationalSummary` per retailer for the `PriceList`, while the full expanded entries remain available for the map.
- The `nearby_prices` RPC explicitly excludes national stores with `NOT s.name LIKE '%(National)%'`.
