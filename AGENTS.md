# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-20
**Commit:** none (no git history)
**Branch:** none

## OVERVIEW
Monster Ireland — a Next.js 16 App Router app for comparing Monster energy drink prices across Irish retailers (Tesco, Dunnes, SuperValu, Lidl, Aldi, etc.) in the Republic of Ireland. Stack: React 19, TypeScript strict, Tailwind CSS v4, Radix UI primitives, nuqs, Supabase.

## STRUCTURE
```
monster-cork/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Inter font, dark theme, Toaster)
│   ├── page.tsx                  # Main dashboard (client component)
│   ├── globals.css               # Tailwind v4 tokens, dark-only theme, shadcn CSS vars
│   ├── loading.tsx               # Route loading state
│   ├── error.tsx                 # Route error boundary
│   ├── not-found.tsx             # 404 page
│   └── api/                      # Route handlers
│       ├── prices/route.ts       # GET (fetch) + POST (submit) prices
│       ├── stores/route.ts       # GET stores by distance
│       └── health/route.ts       # Health + data freshness monitoring
├── components/
│   ├── app/                      # App-specific components (12 files)
│   │   ├── Header.tsx
│   │   ├── LocationSection.tsx
│   │   ├── FilterBar.tsx
│   │   ├── VariantPicker.tsx
│   │   ├── PriceList.tsx
│   │   ├── PriceCard.tsx
│   │   ├── NationalPriceCard.tsx
│   │   ├── PriceDetailSheet.tsx
│   │   ├── BestPriceBanner.tsx
│   │   ├── ReportPriceModal.tsx
│   │   ├── RetailerBadge.tsx
│   │   └── StoreMap.tsx
│   └── ui/                       # shadcn/ui primitives
├── hooks/                        # React hooks
│   ├── use-geolocation.ts        # Browser GPS + localStorage caching + permissions
│   └── use-price-query.ts        # Data fetching with abort, loading, error states
├── lib/
│   ├── types.ts                  # Store, Product, Price, PriceWithJoins, etc.
│   ├── constants.ts              # Cork center, 11 retailers, 17 variants, PACK_SIZES
│   ├── geo.ts                    # geolib wrappers: distance, radius filter, formatting
│   ├── prices.ts                 # expandNationalPrices() + mergeUserPrices() + summarizeNationalPrices()
│   ├── drs.ts                    # splitPrice() — DRS deposit calculation (€0.15/can)
│   ├── validate.ts               # Input validation for lat, lng, radius, price, enums, strings
│   ├── rate-limit.ts             # DB-backed + in-memory rate limiter (checkRateLimitDB)
│   ├── __tests__/                # Unit tests (constants, geo, prices, middleware-permissions)
│   └── supabase/
│       ├── server.ts             # Server Components / API routes Supabase client
│       └── client.ts             # Browser-side Supabase client
├── scripts/scrapers/             # Python 3 scrapers (separate runtime)
│   ├── base.py                   # BaseScraper ABC with retry logic, rate limiting
│   ├── supervalu_base.py         # Shared Mercatus API logic for SuperValu scrapers
│   ├── run_scrapers.py           # Orchestrator: scrape → upsert to Supabase
│   ├── aldi_ie.py                # Aldi IE API scraper
│   ├── lidl_ie.py                # Lidl IE API scraper
│   ├── tesco_ie.py               # Tesco IE web scraper (curl_cffi, Akamai bypass)
│   ├── dunnes_ie.py              # Dunnes Stores web scraper (curl_cffi, Cloudflare resilience)
│   ├── supervalu_ie.py           # SuperValu Mercatus API scraper
│   ├── supervalu_softdrinks_ie.py# SuperValu soft drinks scraper
│   ├── centra_ie.py              # Centra web scraper
│   ├── firecrawl_ie.py           # AI-assisted Firecrawl scraper (fallback)
│   ├── providers/                # ScrapingProvider ABC + FirecrawlProvider
│   ├── check_schema.py, cleanup_prices.py, diagnose_dunnes.py
│   ├── requirements.txt          # Python dependencies
│   └── AGENTS.md                 # Scraper-specific agent knowledge base
├── supabase/migrations/          # 35 SQL migrations
├── e2e/
│   └── dashboard.spec.ts         # Playwright E2E tests
├── docs/
│   ├── adr/                      # Architecture Decision Records
│   └── agents/                   # Agent infrastructure config (issue-tracker, triage-labels, domain)
└── .github/workflows/
    ├── scrape-daily.yml          # 09:00 UTC daily scrape via GitHub Actions
    └── ci.yml                    # Lint + test CI pipeline
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a new retailer color | `lib/constants.ts` | `RETAILERS` array |
| Add a new Monster variant | `lib/constants.ts` | `MONSTER_VARIANTS` array |
| Change search radius defaults | `lib/constants.ts` | `DEFAULT_RADIUS_KM`, `MIN_RADIUS_KM`, `MAX_RADIUS_KM` |
| Change map center | `lib/constants.ts` | `DEFAULT_CENTER` (kept for distance calculations) |
| Add a new API route | `app/api/<name>/route.ts` | Follow existing GET/POST patterns |
| Modify national price expansion | `lib/prices.ts` | `expandNationalPrices()`, `summarizeNationalPrices()` |
| Modify user price merge | `lib/prices.ts` | `mergeUserPrices()` |
| Modify rate limiting | `lib/rate-limit.ts` + `app/api/*/route.ts` | `checkRateLimitDB()` + per-route defaults |
| Modify DRS deposit logic | `lib/drs.ts` | `splitPrice()`, `DRS_RATE = 0.15` |
| Add input validation | `lib/validate.ts` | `validateLat()`, `validateLng()`, `validatePrice()`, etc. |
| Modify store lookup | `app/api/stores/route.ts` | Radius + retailer filtering |
| Add a UI component | `components/app/` | Co-locate with existing app components |
| Modify filter state | `components/app/FilterBar.tsx` | State synced to URL via nuqs |
| Modify Supabase queries | `lib/supabase/server.ts` or `lib/supabase/client.ts` | Server vs browser |
| Add a new scraper | `scripts/scrapers/` | Extend `BaseScraper`, register in `run_scrapers.py` |
| Change scraper politeness | `scripts/scrapers/base.py` | `delay` parameter (default 2.0s) |
| Update database schema | `supabase/migrations/` | Add new `.sql` file |
| Change theme colors | `app/globals.css` | `:root` block, `oklch` values |
| Change fonts | `app/layout.tsx` | Inter variable font |
| Change security headers | `middleware.ts` | CSP, HSTS, X-Frame-Options |
| Understand data flow | `app/api/prices/route.ts` | GET handler orchestrates: RPC → expand → merge → summarize |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Store` | Interface | `lib/types.ts` | Core domain type (id, name, retailer, lat, lng, etc.) |
| `Product` | Interface | `lib/types.ts` | Core domain type (id, name, variant, pack_size, etc.) |
| `Price` | Interface | `lib/types.ts` | Core domain type (joins Store + Product + DRS/clubcard) |
| `PriceWithJoins` | Interface | `lib/types.ts` | Raw DB join result (stores + products nested) |
| `PriceEntry` | Type | `lib/prices.ts` | PriceWithJoins + computed fields (distance, per_can, drs) |
| `NationalSummary` | Interface | `lib/prices.ts` | Collapsed retailer summary for UI (one card per retailer) |
| `UserPriceRecord` | Interface | `lib/prices.ts` | User-reported price with expiry |
| `DEFAULT_CENTER` | Constant | `lib/constants.ts` | Distance calc anchor |
| `RETAILERS` | Constant | `lib/constants.ts` | 11 retailers with brand colors |
| `MONSTER_VARIANTS` | Constant | `lib/constants.ts` | Product variants |
| `PACK_SIZES` | Constant | `lib/constants.ts` | Valid pack size values |
| `expandNationalPrices()` | Function | `lib/prices.ts` | Fan out national prices to physical stores in radius |
| `summarizeNationalPrices()` | Function | `lib/prices.ts` | Collapse expanded entries to one summary per retailer |
| `mergeUserPrices()` | Function | `lib/prices.ts` | Filter + aggregate user-reported prices by distance |
| `splitPrice()` | Function | `lib/drs.ts` | Split total into base_price + drs_deposit |
| `checkRateLimitDB()` | Function | `lib/rate-limit.ts` | Two-tier rate limiting (DB + in-memory fallback) |
| `getClientIp()` | Function | `lib/rate-limit.ts` | Extract client IP from request headers |
| `createClient` | Function | `lib/supabase/server.ts` | Server-side Supabase SSR client (anon key) |
| `createClient` | Function | `lib/supabase/client.ts` | Browser-side Supabase client (anon key) |
| `BaseScraper` | Class (ABC) | `scripts/scrapers/base.py` | Abstract scraper with politeness delay |
| `run_scrapers.py` | Script | `scripts/scrapers/run_scrapers.py` | Orchestrator: scrape → upsert to Supabase |

## CONVENTIONS
- `@/*` path alias maps to project root (not `src/`)
- Dark-only theme: `:root` is dark, `.dark` class for shadcn compatibility
- Green primary accent: `oklch(0.72 0.22 145)` — used sparingly for savings/best-price highlights
- Tailwind CSS v4: all config in `globals.css` via `@theme`, no `tailwind.config.*`
- ESLint flat config (`eslint.config.mjs`) with Next.js core-web-vitals + TypeScript presets only
- No Prettier config
- Images unoptimized (`next.config.ts`): deliberate opt-out for static hosting
- Bun package manager (`bun.lock` is the canonical lockfile)
- Component styling: `clsx` + CVA for conditional classes — no CSS-in-JS
- Radix UI primitives for dialogs, selects, and popovers — custom styled with Tailwind
- Filter state lives in URL search params via `nuqs`
- Leaflet loaded via `next/dynamic` with `ssr: false` to avoid SSR issues
- Every interactive element gets `transform: scale(0.97)` press feedback
- `prefers-reduced-motion` respected — all animations disabled at user preference
- Semantic z-index scale (`--z-header: 60`, `--z-dialog: 90`)

## ANTI-PATTERNS (THIS PROJECT)
- **No `@ts-ignore`, `@ts-expect-error`, or `as any`** — fix types properly
- **No empty catch blocks** — always handle or re-throw with context
- **No deleting tests to pass** — fix the code, not the tests
- **Dual `createClient` exports** — `lib/supabase/server.ts` and `lib/supabase/client.ts` both export `createClient()`, easy to import wrong one

## UNIQUE STYLES
- **Polyglot project**: TypeScript/Next.js web app + Python scrapers in same repo, no monorepo tooling
- **Scrapers use Supabase service-role key** — bypass RLS by design (backend-only scripts)
- **Health endpoint is the single keep-alive** — `/api/health` reports data freshness and prevents Supabase free-tier pausing (Vercel cron pings it every 3 days)
- **Geolocation is client-side only** — `use-geolocation.ts` hook, no server-side geolocation
- **All prices have dual source tracking** — `source: 'scraper' | 'user_upload' | 'user_reported'` field on every price row
- **National pricing model**: one price per (retailer, product), fanned out to physical stores at query time
- **Session-based identity**: no auth system — favorites, alerts, and price reports tied to session/IP only
- **User prices auto-expire**: 7-day expiry via SQL default (`now() + interval '7 days'`)

## COMMANDS
```bash
# Dev server (Bun)
bun dev

# Production build
bun run build

# Lint
bun run lint

# Unit tests
bun run test

# E2E tests
bun run test:e2e

# Run scrapers locally
cd scripts/scrapers
pip install -r requirements.txt
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> python run_scrapers.py
```

## Agent skills

### Issue tracker

Issues tracked in GitHub Issues (`fwhite2104/White-Monster`). See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — `CONTEXT.md` at repo root + `docs/adr/`. See `docs/agents/domain.md`.

## NOTES
- Supabase free tier pauses after 7 days of inactivity; Vercel cron prevents this by pinging `/api/health` every 3 days
- Scrapers run via GitHub Actions (`scrape-daily.yml`) at 09:00 UTC daily (10:00 IST during DST)
- `next-env.d.ts` is in `.gitignore` — do not commit it
- `.sisyphus/` at repo root is OpenCode session metadata, not project code
- `ignoreScripts` + `trustedDependencies` in `package.json` is a Bun-specific workaround for `sharp` and `unrs-resolver`
- `components/app/StoreMap.tsx` uses Leaflet with dynamic import and `ssr: false`
- 35 SQL migrations in `supabase/migrations/` (001–035)
