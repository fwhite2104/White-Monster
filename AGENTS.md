# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-01
**Commit:** none (no git history)
**Branch:** none

## OVERVIEW
Monster Cork — a Next.js 16 App Router app for comparing Monster energy drink prices across Irish retailers (Tesco, Dunnes, SuperValu, Lidl, Aldi, etc.) in Cork. Stack: React 19, TypeScript strict, Tailwind CSS v4, Radix UI primitives, nuqs, Supabase.

## STRUCTURE
```
monster-cork/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (dark theme, Fira Sans)
│   ├── page.tsx            # Main dashboard (client component)
│   ├── globals.css         # Tailwind v4 tokens, dark-only theme
│   ├── loading.tsx         # Route loading state
│   ├── error.tsx           # Route error boundary
│   ├── not-found.tsx       # 404 page
│   └── api/                # Route handlers
│       ├── prices/route.ts # GET/POST prices
│       ├── stores/route.ts # GET stores by distance
│       └── health/route.ts # Health + data freshness monitoring
├── components/
│   └── app/                # App-specific components
│       ├── Header.tsx
│       ├── LocationSection.tsx
│       ├── FilterBar.tsx
│       ├── PriceList.tsx
│       ├── PriceCard.tsx
│       ├── PriceDetailSheet.tsx
│       ├── ReportPriceModal.tsx
│       ├── BestPriceBanner.tsx
│       └── RetailerBadge.tsx
├── hooks/                  # use-geolocation.ts, use-price-query.ts
├── lib/
│   ├── types.ts            # Store, Product, Price interfaces
│   ├── constants.ts        # Cork center, retailers, variants, radius limits
│   ├── geo.ts              # geolib distance utilities
│   ├── utils.ts            # cn() helper (clsx only)
│   └── supabase/           # Dual Supabase clients
│       ├── server.ts       # Server Components / API routes
│       └── client.ts       # Browser-side
├── scripts/scrapers/       # Python 3 scrapers (separate runtime)
│   ├── base.py             # BaseScraper ABC
│   ├── run_scrapers.py     # Orchestrator
│   ├── aldi_ie.py          # Aldi IE API scraper
│   ├── lidl_ie.py          # Lidl IE API scraper
│   ├── requirements.txt    # Pinned direct dependencies
│   └── requirements.lock   # Full transitive lockfile
├── supabase/migrations/    # SQL schema + seed data
└── .github/workflows/      # scrape-daily.yml
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Add a new retailer color | `lib/constants.ts` | `RETAILERS` array |
| Add a new Monster variant | `lib/constants.ts` | `MONSTER_VARIANTS` array |
| Change search radius defaults | `lib/constants.ts` | `DEFAULT_RADIUS_KM`, `MIN_RADIUS_KM`, `MAX_RADIUS_KM` |
| Change map center | `lib/constants.ts` | `CORK_CENTER` (kept for distance calculations) |
| Add a new API route | `app/api/<name>/route.ts` | Follow existing GET/POST patterns |
| Modify price logic | `app/api/prices/route.ts` | Joins stores + products, filters by distance |
| Modify store lookup | `app/api/stores/route.ts` | Radius + retailer filtering |
| Add a UI component | `components/app/` | Co-locate with existing app components |
| Modify filter state | `components/app/FilterBar.tsx` | State synced to URL via nuqs |
| Modify Supabase queries | `lib/supabase/server.ts` or `lib/supabase/client.ts` | Server vs browser |
| Add a new scraper | `scripts/scrapers/` | Extend `BaseScraper`, register in `run_scrapers.py` |
| Change scraper politeness | `scripts/scrapers/base.py` | `delay` parameter (default 2.0s) |
| Update database schema | `supabase/migrations/` | Add new `.sql` file |
| Change theme colors | `app/globals.css` | `@theme` block, `oklch` values |
| Change fonts | `app/layout.tsx` | `Fira_Sans` and `Fira_Code` variable fonts |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `Store` | Interface | `lib/types.ts` | Core domain type |
| `Product` | Interface | `lib/types.ts` | Core domain type |
| `Price` | Interface | `lib/types.ts` | Core domain type (joins Store + Product) |
| `CORK_CENTER` | Constant | `lib/constants.ts` | Distance calc anchor |
| `RETAILERS` | Constant | `lib/constants.ts` | 11 retailers with brand colors |
| `MONSTER_VARIANTS` | Constant | `lib/constants.ts` | Product variants |
| `createClient` | Function | `lib/supabase/server.ts` | Server-side Supabase SSR client |
| `createClient` | Function | `lib/supabase/client.ts` | Browser-side Supabase client |
| `BaseScraper` | Class (ABC) | `scripts/scrapers/base.py` | Abstract scraper with politeness delay |
| `run_scrapers.py` | Script | `scripts/scrapers/run_scrapers.py` | Orchestrator: scrape → upsert to Supabase |

## CONVENTIONS
- `@/*` path alias maps to project root (not `src/`)
- Dark-only theme: `:root` is dark
- Green primary accent: `oklch(0.72 0.22 145)` — used sparingly for savings/best-price highlights
- Tailwind CSS v4: all config in `globals.css` via `@theme`, no `tailwind.config.*`
- ESLint flat config (`eslint.config.mjs`) with Next.js core-web-vitals + TypeScript presets only
- No Prettier config
- Images unoptimized (`next.config.ts`): deliberate opt-out for static hosting
- Bun package manager (`bun.lock` is the canonical lockfile)
- Component styling: `clsx` only for conditional classes — no CSS-in-JS
- Radix UI primitives for dialogs, selects, and popovers — custom styled with Tailwind
- Filter state lives in URL search params via `nuqs`

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
- **All prices have dual source tracking** — `source: 'scraper' | 'user_upload'` field on every price row

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

## SHARED MEMORY LAYER

This project uses an Obsidian vault as a shared memory layer at `/home/feilim/Feilims Vault/`.

### Session Start (MANDATORY)
Before starting work, read these files:
1. `Context/you.md` — User preferences and style
2. `Context/active-tasks.md` — What we're working on
3. `Context/recent-decisions.md` — Past decisions to avoid re-litigating

### During Work
- Query `wiki/` for existing knowledge before implementing
- Note decisions in `Context/recent-decisions.md`
- Capture patterns in `Patterns/` (bug fixes, design decisions, workflows)

### Session End (MANDATORY)
Update these files before finishing:
1. `Context/active-tasks.md` — Mark completed tasks, add new ones
2. `Context/recent-decisions.md` — Log decisions made (keep last 10)
3. `Patterns/` — Capture any patterns found
4. `AI Log/` — Log session learnings if significant

### Vault Structure
```
/home/feilim/Feilims Vault/
├── Context/          # Quick-load session context
├── Patterns/         # Behaviors to reproduce
├── Projects/         # Project tracking
├── AI Log/           # Session transcripts
├── wiki/             # Processed knowledge
└── CLAUDE.md         # Full vault schema
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
