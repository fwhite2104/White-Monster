# Monster Cork 🥤📍

**Find the cheapest Monster Energy drinks near you in Cork, Ireland.**

Monster Cork is a location-aware price comparison app that tracks Monster Energy drink prices across 11 Irish retailers. It uses device geolocation (or manual area search) to find nearby stores with the best deals, visualize them on a Leaflet map, and let users contribute prices back to the community.

**[View Live Demo](https://white-monster-tracker.vercel.app)**

---

## Features

- **Location-based search** — uses browser geolocation or manual area entry to find nearby prices within a configurable radius (1–50 km)
- **Live price comparisons** — prices across Tesco, Dunnes, SuperValu, Lidl, Aldi, Centra, Spar, Dealz, Londis, Costcutter, and other retailers, updated daily
- **17 Monster variants tracked** — Zero Sugar, Ultra White, Ultra Rosa, Ultra Paradise, Ultra Gold, Ultra Violet, Ultra Peachy Keen, Mango Loco, Pipeline Punch, Assault, Khaotic, Viking Berry, Juice Monster Apple, Hydro Watermelon, Rehab Lemon Tea, Rehab Green Tea, Lando Norris Edition
- **Pack size filtering** — single cans and 4-packs with per-can price normalization for fair comparison
- **Sort options** — by price (cheapest first), distance (nearest first), or store name
- **Interactive map** — Leaflet-based store locator with dark-themed popups, distance markers, and price details per store
- **Tesco Clubcard pricing** — shows Clubcard-exclusive prices with savings breakdown where available
- **DRS deposit transparency** — Ireland's Deposit Return Scheme (€0.15 per 250ml can) is displayed separately so you see the base product price vs. refundable deposit
- **Community price reporting** — users can submit prices they spot in stores; submissions expire after 7 days
- **Weekly deals tracking** — multi-buy, Clubcard, loyalty, clearance, and bundle deals with expiry timers
- **Barcode scanning** — scan a Monster can barcode with your phone camera to instantly look up prices for that variant nearby
- **Price history charts** — view price trends over time for any product at any retailer (driven by `price_history` table)
- **Price alerts** — set price drop alerts on your favorite variants and get notified via toast when prices fall
- **Favorites** — save favorite products and stores to your session for quick access
- **Data freshness monitoring** — health endpoint tracks staleness, prevents Supabase free-tier pausing via cron pings
- **First-visit onboarding** — clean intro screen that guides users to share location or search manually before showing results
- **Responsive tabbed UI** — List, Deals comparison, Stores map, and Search tabs with a mobile-friendly bottom nav bar
- **Accessibility** — skip-to-content link, focus-visible outlines, `aria-live` regions, reduced-motion support, keyboard-navigable

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Browser / User                         │
│  geolocation | manual search | variant select | submit   │
└──────────────┬───────────────────────────────┬────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐   ┌─────────────────────────┐
│  Next.js 16 (App Router)    │   │   Leaflet Map (client)   │
│  React 19 / TypeScript      │   │  dynamic import ssr:false│
│  Tailwind CSS v4 + shadcn   │   └─────────────────────────┘
│  framer-motion animations   │
│                             │
│  ┌─── Page ─────────────────┤
│  │  /  → dashboard          │
│  │                          │
│  ├─── API Routes ───────────┤
│  │  GET  /api/prices        │
│  │  POST /api/prices        │
│  │  GET  /api/stores        │
│  │  GET  /api/health        │
│  └──────────────────────────┘
└──────────────┬───────────────┘
               │
               ▼
┌────────────────────────────────────────────────────┐
│              Supabase / PostgreSQL                  │
│                                                     │
│  stores ─── prices ─── products                     │
│  user_prices (7-day expiry)                         │
│  price_history ─── price_alerts                     │
│  user_favorites ─── deals ─── deals_products        │
│  convenience_stores ─── store_registration_requests │
│  rate_limits                                        │
│                                                     │
│  PostGIS extension for spatial radius queries       │
│  nearby_prices RPC (PostGIS ST_DWithin)             │
│  Row Level Security (RLS) on all tables             │
└────────────────────────────────────────────────────┘
         ▲                                ▲
         │                                │
┌────────┴────────┐          ┌────────────┴────────────┐
│  GitHub Actions  │          │  Community Contributions │
│  Daily 09:00 UTC │          │  User-submitted prices   │
│  Python scrapers │          │  (7-day expiry via RLS)  │
│  Supabase upsert │          │  Rate-limited: 5/min/ip  │
│  (service-role)  │          │  (anon key, RLS-gated)   │
└──────────────────┘          └─────────────────────────┘
```

### Data Flow

1. **Centralized pricing model** — each retailer has national price entries stored in the `prices` table. The API expands these to physical store locations at query time via `expandNationalPrices()` in `lib/prices.ts`.
2. **Spatial expansion** — user provides location (browser geolocation or manual input). The API runs `nearby_prices` (PostGIS `ST_DWithin`) and then expands national prices to nearby physical stores.
3. **Fallback to national** — if no physical store of a retailer exists within the user's radius, the national price entry itself appears (with distance from Cork center).
4. **Deduplication** — `user_prices` (community-reported) override automated prices at the same store+product. The lowest price per `(store_id, product_id)` wins, with `user_reported` preferred over `scraper` sources.
5. **Community contributions** — users submit via `POST /api/prices`. A new store is created or found, a `user_prices` row is inserted with a 7-day `expires_at` timestamp, and the query merges unexpired entries.
6. **DRS handling** — Ireland's Deposit Return Scheme adds €0.15 per 250ml can. The `splitPrice()` function in `lib/drs.ts` separates the display into `base_price` + `drs_deposit` so users see what's refundable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) with Turbopack |
| **UI** | React 19, TypeScript (strict mode) |
| **Styling** | Tailwind CSS v4, `tw-animate-css`, `shadcn/ui` v4, CVA |
| **Animation** | framer-motion v12 with custom easing curves |
| **Maps** | Leaflet + react-leaflet (client-only, `ssr: false`) |
| **Charts** | Recharts (price history) |
| **Database** | Supabase (PostgreSQL 15 + PostGIS) |
| **Icons** | lucide-react |
| **Testing** | Vitest v4, jsdom, Playwright v1.60 (E2E) |
| **Package Manager** | Bun 1.2 |
| **Data Ingestion** | Python 3.11 (scripts/scrapers/) |
| **CI/CD** | GitHub Actions, Vercel |

---

## Project Structure

```
monster-cork/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout — Inter font, dark theme, Toaster
│   ├── page.tsx                      # Main dashboard (client component, 468 lines)
│   ├── globals.css                   # Tailwind v4 @theme tokens, shadcn CSS vars
│   └── api/
│       ├── prices/route.ts           # GET (fetch) + POST (submit) prices
│       ├── stores/route.ts           # GET stores by location + radius
│       └── health/route.ts           # Health check + data freshness monitoring
│
├── components/
│   ├── ui/                           # shadcn/ui primitives (auto-generated)
│   ├── dashboard/                    # 34 app-specific components
│   │   ├── PriceList.tsx             # Sortable/filterable price card list
│   │   ├── PriceCard.tsx             # Individual price display card
│   │   ├── ItemComparisonView.tsx    # Multi-item comparison by variant
│   │   ├── HeroCard.tsx              # Top-level summary card
│   │   ├── BestDealBanner.tsx        # Best vs. next-best price banner
│   │   ├── FilterDrawer.tsx          # Filter/sort/radius drawer
│   │   ├── BottomTabNav.tsx          # Mobile bottom nav (list/deals/stores/search)
│   │   ├── LocationBanner.tsx        # GPS/manual location header
│   │   ├── StateScreens.tsx          # Empty, error, denied, timeout states
│   │   ├── FirstVisitScreen.tsx      # Onboarding first-visit screen
│   │   ├── StoreUploadForm.tsx       # Community price submission form
│   │   ├── ReportPriceCard.tsx       # "Report a price" inline card
│   │   ├── WeeklyDealsBanner.tsx     # Current deals promo banner
│   │   ├── DealCard.tsx / DealBadge.tsx / DealExpiryTimer.tsx
│   │   ├── PriceHistoryChart.tsx     # Recharts history graph
│   │   ├── PriceAlertDialog.tsx / PriceAlertList.tsx
│   │   ├── ClubcardBadge.tsx / ClubcardToggle.tsx
│   │   ├── DrsBadge.tsx / DrsBreakdown.tsx / DrsInfoDialog.tsx
│   │   └── ... (convenience stores, registration, savings, etc.)
│   ├── map/
│   │   └── StoreMapBlock.tsx         # Leaflet map (dynamic import, ssr: false)
│   └── shared/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── MapErrorBoundary.tsx
│
├── hooks/                            # React hooks
│   ├── use-geolocation.ts            # Browser GPS + localStorage caching + permissions
│   ├── use-price-query.ts            # Data fetching with abort, loading, error states
│   ├── use-has-map-realestate.ts     # Responsive map visibility
│   ├── use-clubcard-preference.ts    # Clubcard holder toggle
│   ├── use-drs-preference.ts         # DRS display toggle
│   ├── use-deals.ts                  # Fetch current deals
│   ├── use-animated-number.ts        # Count-up animation for prices
│   └── use-convenience-stores.ts     # Convenience store registry
│
├── lib/
│   ├── types.ts                      # Store, Product, Price, UserPrice, UserFavorite interfaces
│   ├── constants.ts                  # Cork center, 11 retailers, 17 variants, radius limits, defaults
│   ├── geo.ts                        # geolib wrappers: distance, radius filter, coordinate validation, formatting
│   ├── prices.ts                     # expandNationalPrices() + mergeUserPrices()
│   ├── drs.ts                        # DRS deposit calculation (€0.15/can), splitPrice()
│   ├── deals.ts                      # Deal types, expiry helpers, formatting
│   ├── clubcard.ts                   # Tesco Clubcard price logic
│   ├── rate-limit.ts                 # DB-backed + in-memory rate limiter (checkRateLimitDB)
│   ├── validate.ts                   # Input validation for lat, lng, radius, enums, prices, strings
│   ├── location.ts                   # Irish location/county helpers
│   ├── convenience-stores.ts         # Convenience store data types
│   ├── utils.ts                      # cn() helper (clsx + tailwind-merge)
│   └── supabase/
│       ├── server.ts                 # Server Components / API routes Supabase client
│       └── client.ts                 # Browser-side Supabase client
│
├── middleware.ts                     # Supabase SSR auth, CSP headers, HSTS, security headers
│
├── scripts/scrapers/                 # Python 3 data ingestion (runs in GitHub Actions CI)
│   ├── base.py                       # BaseScraper ABC with retry logic, rate limiting
│   ├── run_scrapers.py               # Orchestrator: runs all scrapers, upserts to Supabase
│   ├── aldi_ie.py                    # Aldi Ireland API scraper
│   ├── lidl_ie.py                    # Lidl Ireland API scraper
│   ├── tesco_ie.py                   # Tesco Ireland web scraper
│   ├── dunnes_ie.py                  # Dunnes Stores web scraper
│   ├── supervalu_ie.py               # SuperValu web scraper
│   ├── supervalu_softdrinks_ie.py    # SuperValu soft drinks scraper
│   ├── centra_ie.py                  # Centra web scraper
│   ├── firecrawl_ie.py               # AI-assisted Firecrawl scraper
│   ├── providers/                    # Retailer provider implementations
│   ├── check_schema.py               # Schema validation helper
│   ├── cleanup_prices.py             # Stale price cleanup
│   ├── diagnose_dunnes.py            # Dunnes scraper diagnostics
│   └── requirements.txt              # Python dependencies (>= ranges, no lock file)
│
├── supabase/migrations/              # 29 SQL migrations
│   ├── 001_initial_schema.sql        # stores, products, prices tables
│   ├── 002_seed_products.sql         # 4 initial Monster variants
│   ├── 003_seed_cork_stores.sql      # Cork store locations with lat/lng
│   ├── 004_add_pack_size.sql         # + single vs 4_pack on products
│   ├── 005-009                       # RLS policies, constraints, user_prices
│   ├── 010_fix_rls_policies.sql      # RLS audit fix
│   ├── 011_data_retention.sql        # Data retention + rate limits
│   ├── 012_nearby_prices_rpc.sql     # PostGIS ST_DWithin stored procedure
│   ├── 013_expand_variants.sql       # 13→17 Monster variants
│   ├── 014-016                       # price_history, price_alerts, user_favorites
│   ├── 017_clubcard_price.sql        # Clubcard pricing column
│   ├── 018-028                       # Deals, convenience stores, PostGIS indexes, approval flags, search paths
│   └── 029_rate_limits_table.sql     # rate_limits table
│
├── e2e/                              # Playwright E2E tests
│   ├── price-list.spec.ts
│   └── filters.spec.ts
│
├── .github/workflows/
│   ├── scrape-daily.yml              # 09:00 UTC daily scrape via GitHub Actions
│   └── ci.yml                        # Lint + test CI pipeline
│
├── next.config.ts                    # Images unoptimized (static hosting), Turbopack
├── playwright.config.ts              # Playwright E2E configuration
├── vitest.config.ts                  # Vitest + jsdom config
├── middleware.ts                     # Security headers (CSP, HSTS, X-Frame-Options, etc.)
└── tsconfig.json                     # TypeScript strict, @/* path alias, ES2017 target
```

---

## API Reference

### `GET /api/prices`

Fetches nearby prices with filtering.

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `lat` | number | Cork center | User latitude |
| `lng` | number | Cork center | User longitude |
| `radius` | number | 10 | Search radius in km (1–50) |
| `variant` | enum | `zero_sugar` | Monster variant slug |
| `sort` | enum | `price` | `price`, `distance`, or `name` |
| `pack_size` | enum | `4_pack` | `all`, `single`, or `4_pack` |

**Rate limit:** 60 requests/minute/IP

### `POST /api/prices`

Submit a community-reported price. Requires body: `{ storeName, price, variant, packSize, lat, lng }` with optional `{ retailer, notes, address }`.

**Rate limit:** 5 submissions/minute/IP

### `GET /api/stores`

Fetches stores near a location. Same `lat`, `lng`, `radius` params as prices.

Falls back to national store entries when no physical store of a retailer exists within the user's radius.

### `GET /api/health`

Returns database status, data freshness classification (`fresh` < 48h, `stale` < 7d, `outdated`), response time, and entity counts. Used by Vercel cron to prevent Supabase free-tier pausing.

---

## Database Schema (20 tables)

| Table | Purpose |
|---|---|
| `stores` | Retailer outlets with lat/lng, approval flag, store type |
| `products` | Monster variants with name, variant slug, size, barcode, pack_size |
| `prices` | Automated price entries (national-level, expanded at query time) |
| `user_prices` | Community-submitted prices with 7-day expiry |
| `price_history` | Historical price snapshots for trend charts |
| `price_alerts` | User-set price drop alerts |
| `user_favorites` | Session-scoped product/store favorites |
| `deals` | Weekly deals (multi-buy, Clubcard, loyalty, clearance, bundle) |
| `deals_products` | Deal-to-product join table |
| `convenience_stores` | Convenience store registry |
| `store_registration_requests` | Pending store addition requests |
| `rate_limits` | Per-IP rate limit tracking |
| _(+ PostGIS spatial index on stores)_ | |

### Key design decisions

- **National pricing model**: retailers set prices centrally, so the DB stores one price per (retailer, product). The API calls `expandNationalPrices()` to fan these out to physical store locations within the user's radius.
- **PostGIS for radius queries**: the `nearby_prices` stored procedure uses `ST_DWithin` on indexed geometry columns for efficient geospatial filtering.
- **Two-tier rate limiting**: an atomic DB-backed limiter (`upsert_rate_limit` RPC) is the primary mechanism, with an in-memory fallback if the database is unreachable.
- **RLS for user data**: `user_prices`, `price_alerts`, and `user_favorites` are protected by Row Level Security policies that restrict access by session ID or IP.

---

## Conventions

- **`@/*` path alias** — maps to project root (no `src/` directory)
- **Dark-only theme** — `:root` is dark, `.dark` class provides an alternate dark variant for shadcn compatibility; `prefers-color-scheme: dark` media query auto-enables
- **Green primary accent** — `oklch(0.72 0.22 145)` with semantic brand glow/surface/muted variants
- **Tailwind CSS v4** — all configuration in `globals.css` via `@theme inline {}`, no `tailwind.config.*`
- **ESLint flat config** — `eslint.config.mjs` with Next.js core-web-vitals + TypeScript strict presets
- **No Prettier** — intentionally omitted
- **Bun** — `bun.lock` present, `packageManager: bun@1.2.15` in `package.json`
- **Component styling** — `class-variance-authority` (CVA) + `tailwind-merge` + `clsx` — no CSS-in-JS
- **Leaflet** — loaded dynamically with `next/dynamic` and `ssr: false` to avoid server-side rendering issues
- **Emil Kowalski easing curves** — custom `--ease-out`, `--ease-in-out`, `--ease-drawer` cubic-bezier values in CSS for polished animations
- **Press state feedback** — every button and link gets `transform: scale(0.97)` on active press
- **Semantic z-index scale** — `--z-base` (0) through `--z-dialog` (90) for consistent layering
- **Spacing rhythm** — `--space-xs` through `--space-4xl` design tokens

---

## Local Development

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) v1.2+
- A Supabase project (free tier works)
- Python 3.11+ (for scrapers)

### Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials:
#   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Start dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

### Commands

| Command | Description |
|---|---|
| `bun dev` | Development server with hot reload |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | ESLint |
| `bun test` | Unit tests (Vitest) |
| `bun test:watch` | Tests in watch mode |
| `bun test:e2e` | Playwright E2E tests |
| `bun test:e2e:ui` | Playwright with UI mode |

### Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (browser-safe) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key with RLS |
| `SUPABASE_URL` | Scrapers only | URL for ingestion scripts |
| `SUPABASE_SERVICE_KEY` | Scrapers only | Service-role key (server-side only) |
| `FIRECRAWL_API_KEY` | Optional | Firecrawl AI scraping provider |

**Security:** Service-role credentials must never be exposed to the client. The web app uses only the anon key with Row Level Security. Ingestion scripts run in GitHub Actions with repository secrets.

### Database Migrations

```bash
# Apply migrations to your Supabase project
supabase migration up

# Or apply individual SQL files from supabase/migrations/
```

---

## Data Ingestion

Automated Python scrapers run daily via GitHub Actions at 09:00 UTC (`.github/workflows/scrape-daily.yml`). Each scraper extends `BaseScraper` (in `scripts/scrapers/base.py`) which provides:

- Configurable rate-limiting delays (default 2s between requests)
- Exponential backoff retry logic on HTTP failures
- Response validation and structured output
- Non-fatal per-retailer error handling — one retailer failure doesn't block others

### Running scrapers locally

```bash
cd scripts/scrapers
pip install -r requirements.txt
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> python run_scrapers.py
```

---

## Community Contributions

Users can submit prices they see in stores through the "Report a price" flow. The submission creates a new `user_prices` row:

1. Store is created or matched by `(name, retailer)` via upsert
2. New stores are flagged `is_approved: false` for moderation
3. Prices are stored with a 7-day `expires_at` via the SQL default
4. Rate-limited to 5 submissions/minute per IP address
5. Submitted prices are merged into query results alongside automated data

---

## Security

- **Content Security Policy** — restrictive CSP set in `middleware.ts`
- **HSTS** — Strict-Transport-Security header with `includeSubDomains`
- **X-Frame-Options** — DENY (no iframe embedding)
- **Row Level Security** — all user-writable tables have RLS policies
- **Rate limiting** — every API endpoint has per-IP rate limits (DB-backed with in-memory fallback)
- **Input validation** — all API parameters are validated and sanitized via `lib/validate.ts`
- **Service-role isolation** — ingestion scripts use service-role key in CI only, never on the client

---

## Known Gaps

- **No `.env.example`** — required variables are undocumented for new contributors
- **No `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`** — missing App Router convention files
- **No pinned Python dependencies** — `requirements.txt` uses `>=` ranges without a lock file
- **Boilerplate public/ assets** — unused `next.svg`, `vercel.svg` ship to production
- **Dual `createClient` exports** — `lib/supabase/server.ts` and `lib/supabase/client.ts` both export `createClient()`, easy to import the wrong one
- **No middleware for Supabase session refresh** — the server client's catch block explicitly notes this gap
- **No E2E tests in CI** — Playwright has no compatible browser for Ubuntu 26.04; tests run locally only

---

## Roadmap

- Additional retailer coverage (e.g., Mace, Daybreak, Gala)
- Price history trend charts on the main dashboard
- Email/push notification alerts for price drops
- Expanded geographic coverage beyond Cork
- Mobile app wrapper
- Store registration workflow refinement
- Admin dashboard for store approval and data moderation

---

## Disclaimer

Monster Cork is an independent, educational project. It is not affiliated with Monster Energy Corporation or any of the retailers listed. Product names, logos, and brands are the property of their respective owners. Prices are provided for informational purposes and may not reflect current in-store pricing. If you are a retailer and wish to have your data excluded, please open an issue.
