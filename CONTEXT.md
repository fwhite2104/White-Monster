# Monster Ireland — Domain Glossary

## Pricing models

| Term | Definition | Example retailers |
|------|------------|-------------------|
| **National pricing** | Retailer sets the same price for a product across all physical store locations. One price entry per product covers every store. | Tesco, Dunnes Stores, SuperValu |
| **Per-store pricing** | Individual stores within a retailer can set different prices for the same product. | Lidl, Aldi (prices vary by location in some cases) |

## Store types

| Term | Definition |
|------|------------|
| **Physical store** | A real-world retail location with lat/lng coordinates on the map. Has a unique `stores.id` and a localised address. |
| **National store entry** | A placeholder store record in the `stores` table with name containing "(National)" — exists to link scraped national prices to a known `store_id`. Used as fallback when no physical stores of that retailer are in range. |

## Map

| Term | Definition |
|------|------------|
| **Collapsed card** | A single price list card representing one nationally-priced retailer. Shows retailer badge, price, distance to nearest store, and store count. Tapping opens the detail sheet. |
| **Store popup** | Leaflet popup shown when tapping a map pin. Contains store name, address, distance, price per can, and external directions link. |
| **Marker cluster** | A Leaflet plugin that groups nearby pins into a numbered cluster at zoomed-out levels. Clusters break apart as the user zooms in. |

## Data pipeline

| Term | Definition |
|------|------------|
| **Overpass seed** | A one-off script (re-run monthly via GitHub Actions) that queries the Overpass API to populate `stores` with physical store locations from OpenStreetMap. |
| **Scraper** | Python script that scrapes product prices from a retailer's website/API. Scrapers produce prices, not store locations. |

## Pricing display

| Term | Definition |
|------|------------|
| **DRS** | Deposit Return Scheme — Ireland's refundable deposit system. €0.15 per 250ml can. Displayed separately from the base price so users see what's refundable. |
| **Clubcard pricing** | Tesco's loyalty-card-exclusive prices. Shown as a savings breakdown next to the standard price. Only applies to Tesco. |
| **Source precedence** | When the same `(store_id, product_id)` has multiple price sources, `user_reported` always wins over `scraper`. Within the same source, the cheaper price wins. |

## Data types

| Term | Definition |
|------|------------|
| **PriceWithJoins** | Raw database join result — a price row with nested `stores` and `products` objects. Used as the base input to expansion and merging functions. |
| **PriceEntry** | A PriceWithJoins plus computed fields: `distance`, `per_can_price`, `base_price`, `drs_deposit`, `clubcard_price`, `has_clubcard_pricing`. This is the final shape used by the UI. |
| **NationalSummary** | A collapsed view of one nationally-priced retailer containing the price, nearest distance, store count, clubcard info, product info, and all store locations. Used to render one card per retailer instead of N duplicate cards. |
| **UserPriceRecord** | A user-submitted price with additional fields: `notes`, `expires_at` (7-day default). Filtered to only unexpired entries at query time. |

## Infrastructure

| Term | Definition |
|------|------------|
| **Two-tier rate limiting** | DB-backed rate limiting via `upsert_rate_limit` RPC is the primary mechanism. If the DB is unreachable (cold start/pause), an in-memory fallback returns `allowed: true` — permissive but non-blocking. |
| **PostGIS ST_DWithin** | The `nearby_prices` stored procedure uses PostGIS's `ST_DWithin` on indexed geometry columns for efficient radius-based store lookups. |
| **nuqs** | Library that syncs React state to URL search params — used for filter/sort/radius/variant state on the dashboard. Enables shareable URLs and persistent filters across reloads. |
| **CVA + clsx + tailwind-merge** | The component styling stack. `class-variance-authority` defines component variants, `clsx` merges conditional classes, `tailwind-merge` resolves Tailwind conflicts. No CSS-in-JS. |

## Identity

| Term | Definition |
|------|------------|
| **Session-based identity** | No user accounts. Identity is derived from the Supabase SSR session cookie (set by middleware) or client IP. Favorites, alerts, and price reports are tied to this ephemeral identity. |
| **Expiring user prices** | Community-submitted prices auto-expire 7 days after submission via the SQL default `now() + interval '7 days'` on the `user_prices` table. RLS filters exclude expired rows. |
