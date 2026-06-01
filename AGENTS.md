# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-01
**Commit:** none (no git history)
**Branch:** none

## OVERVIEW
Monster Cork — a Next.js 16 App Router app for comparing Monster energy drink prices across Irish retailers (Tesco, Dunnes, SuperValu, Lidl, Aldi, etc.) in Cork. Stack: React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui v4, Supabase, Leaflet maps.

## STRUCTURE
```
monster-cork/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (dark theme, Inter font)
│   ├── page.tsx            # Main dashboard (client component)
│   ├── globals.css         # Tailwind v4 tokens, dark-only theme
│   └── api/                # Route handlers
│       ├── prices/route.ts # GET/POST prices
│       ├── stores/route.ts # GET stores by distance
│       └── health/route.ts # Keep-alive / health ping
├── components/
│   ├── ui/                 # shadcn/ui components (auto-generated)
│   ├── dashboard/          # App-specific components (filters, list, map, upload)
│   ├── shared/             # Header, Footer
│   └── map/                # Leaflet map wrapper (dynamic import, ssr: false)
├── hooks/                  # use-geolocation.ts
├── lib/
│   ├── types.ts            # Store, Product, Price interfaces
│   ├── constants.ts        # Cork center, retailers, variants, radius limits
│   ├── geo.ts              # geolib distance utilities
│   ├── utils.ts            # cn() helper (clsx + tailwind-merge)
│   └── supabase/           # Dual Supabase clients
│       ├── server.ts       # Server Components / API routes
│       └── client.ts       # Browser-side
├── scripts/scrapers/       # Python 3 scrapers (separate runtime)
│   ├── base.py             # BaseScraper ABC
│   ├── run_scrapers.py     # Orchestrator
│   ├── aldi_ie.py          # Aldi IE API scraper
│   ├── lidl_ie.py          # Lidl IE API scraper
│   └── requirements.txt
├── supabase/migrations/    # SQL schema + seed data
└── .github/workflows/      # scrape-daily.yml, keep-alive.yml
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a new retailer color | `lib/constants.ts` | `RETAILERS` array |
| Add a new Monster variant | `lib/constants.ts` | `MONSTER_VARIANTS` array |
| Change search radius defaults | `lib/constants.ts` | `DEFAULT_RADIUS_KM`, `MIN_RADIUS_KM`, `MAX_RADIUS_KM` |
| Change map center | `lib/constants.ts` | `CORK_CENTER` |
| Add a new API route | `app/api/<name>/route.ts` | Follow existing GET/POST patterns |
| Modify price logic | `app/api/prices/route.ts` | Joins stores + products, filters by distance |
| Modify store lookup | `app/api/stores/route.ts` | Radius + retailer filtering |
| Add a shadcn component | `components/ui/` | Use `shadcn add <component>` |
| Add a dashboard component | `components/dashboard/` | Co-locate with existing |
| Modify Supabase queries | `lib/supabase/server.ts` or `lib/supabase/client.ts` | Server vs browser |
| Add a new scraper | `scripts/scrapers/` | Extend `BaseScraper`, register in `run_scrapers.py` |
| Change scraper politeness | `scripts/scrapers/base.py` | `delay` parameter (default 2.0s) |
| Update database schema | `supabase/migrations/` | Add new `.sql` file |
| Change theme colors | `app/globals.css` | `@theme` block, `oklch` values |
| Change fonts | `app/layout.tsx` | `Inter` variable font |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Store` | Interface | `lib/types.ts` | Core domain type |
| `Product` | Interface | `lib/types.ts` | Core domain type |
| `Price` | Interface | `lib/types.ts` | Core domain type (joins Store + Product) |
| `CORK_CENTER` | Constant | `lib/constants.ts` | Map + distance calc anchor |
| `RETAILERS` | Constant | `lib/constants.ts` | 11 retailers with brand colors |
| `MONSTER_VARIANTS` | Constant | `lib/constants.ts` | 4 product variants |
| `createClient` | Function | `lib/supabase/server.ts` | Server-side Supabase SSR client |
| `createClient` | Function | `lib/supabase/client.ts` | Browser-side Supabase client |
| `BaseScraper` | Class (ABC) | `scripts/scrapers/base.py` | Abstract scraper with politeness delay |
| `run_scrapers.py` | Script | `scripts/scrapers/run_scrapers.py` | Orchestrator: scrape → upsert to Supabase |

## CONVENTIONS
- `@/*` path alias maps to project root (not `src/`)
- Dark-only theme: `:root` is dark, `.dark` class provides alternate dark variant
- Green primary accent: `oklch(0.7 0.25 145)`
- Tailwind CSS v4: all config in `globals.css` via `@theme`, no `tailwind.config.*`
- ESLint flat config (`eslint.config.mjs`) with Next.js core-web-vitals + TypeScript presets only
- No Prettier config
- Images unoptimized (`next.config.ts`): deliberate opt-out for static hosting
- Bun package manager (`bun.lock` present, no `packageManager` field in package.json)
- Component styling: `class-variance-authority` (CVA) + `tailwind-merge` + `clsx` — no CSS-in-JS
- Leaflet loaded dynamically with `ssr: false` to avoid server-side rendering issues

## ANTI-PATTERNS (THIS PROJECT)
- **No `.env.example`** — onboarding broken; required vars are undocumented
- **No tests** — zero test framework, zero test files
- **Missing App Router convention files** — no `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, `middleware.ts`
- **Dual `createClient` exports** — `lib/supabase/server.ts` and `lib/supabase/client.ts` both export `createClient()`, easy to import wrong one
- **Duplicate keep-alive mechanisms** — `vercel.json` cron + `.github/workflows/keep-alive.yml` both ping Supabase every 3 days
- **No pinned Python dependencies** — `scripts/scrapers/requirements.txt` uses `>=` ranges, no lock file
- **Boilerplate public/ assets** — unused `next.svg`, `vercel.svg`, etc. ship to production
- **Boilerplate README** — default `create-next-app` output, zero project-specific docs

## UNIQUE STYLES
- **Polyglot project**: TypeScript/Next.js web app + Python scrapers in same repo, no monorepo tooling
- **Scrapers use Supabase service-role key** — bypass RLS by design (backend-only scripts)
- **Health endpoint doubles as keep-alive ping** — `/api/health` queries `products` table to prevent Supabase free-tier pausing
- **Geolocation is client-side only** — `use-geolocation.ts` hook, no server-side geolocation
- **All prices have dual source tracking** — `source: 'scraper' | 'user_upload'` field on every price row
- **No middleware for Supabase session refresh** — `lib/supabase/server.ts` catch block explicitly notes this gap

## COMMANDS
```bash
# Dev server (Bun)
bun dev

# Production build
bun run build

# Lint
bun run lint

# Run scrapers locally
cd scripts/scrapers
pip install -r requirements.txt
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> python run_scrapers.py
```

## NOTES
- Supabase free tier pauses after 7 days of inactivity; dual cron systems exist to prevent this
- Scrapers run via GitHub Actions (`scrape-daily.yml`) at 06:00 UTC daily
- `next-env.d.ts` is in `.gitignore` — do not commit it
- `.sisyphus/` at repo root is OpenCode session metadata, not project code
- `ignoreScripts` + `trustedDependencies` in `package.json` is a Bun-specific workaround for `sharp` and `unrs-resolver`
