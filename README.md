# Monster Cork

Find the cheapest White Monster in Cork, Ireland.

Monster Cork is a price comparison web app that tracks Monster energy drink prices across Irish retailers. It shows you the nearest stores with the best prices, using your location and an interactive map.

## Features

- Price comparison across Tesco, SuperValu, Dunnes, Aldi, and Lidl
- Geolocation-based store search with configurable radius
- Interactive Leaflet map with store markers
- Price reporting by users (crowdsourced submissions)
- Automated daily price scraping via GitHub Actions
- Filter by variant (Zero Sugar, Ultra White, Ultra Rosa, Ultra Paradise) and pack size (single, 4-pack)
- Sort results by price, distance, or store name
- Dark-only UI with smooth animations via framer-motion
- Health endpoint with data freshness monitoring

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui v4 |
| Database | Supabase (Postgres + PostGIS) |
| Maps | Leaflet, react-leaflet |
| Animation | framer-motion |
| Scrapers | Python 3.11, curl_cffi, BeautifulSoup |
| Package Manager | Bun |
| Testing | Vitest |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh) (v1.2+)
- Python 3.11+ (only needed to run scrapers locally)
- A Supabase project

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For running scrapers locally, you also need:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

See `.env.example` for the full list of required variables.

### Installation

```bash
bun install
```

Start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server with hot reload |
| `bun run build` | Production build |
| `bun run lint` | Run ESLint |
| `bun test` | Run tests (Vitest) |
| `bun test:watch` | Run tests in watch mode |

## Project Structure

```
monster-cork/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (dark theme, Inter font)
│   ├── page.tsx            # Main dashboard (client component)
│   ├── globals.css         # Tailwind v4 tokens, dark-only theme
│   └── api/                # Route handlers
│       ├── prices/         # GET/POST prices
│       ├── stores/         # GET stores by distance
│       └── health/         # Health + data freshness monitoring
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── dashboard/          # Filters, list, map, upload
│   ├── shared/             # Header, Footer
│   └── map/                # Leaflet map wrapper (dynamic import)
├── hooks/                  # use-geolocation.ts
├── lib/
│   ├── types.ts            # Store, Product, Price interfaces
│   ├── constants.ts        # Cork center, retailers, variants
│   ├── geo.ts              # Distance utilities (geolib)
│   ├── utils.ts            # cn() helper
│   └── supabase/           # Server + browser Supabase clients
├── scripts/scrapers/       # Python price scrapers
├── supabase/migrations/    # SQL schema + seed data
└── .github/workflows/      # CI/CD (daily scraper)
```

For detailed navigation guidance, see `AGENTS.md`.

## Scraper System

The scrapers live in `scripts/scrapers/` and run as a separate Python runtime alongside the Next.js app.

### Available Scrapers

| Retailer | File | Method |
|----------|------|--------|
| Tesco | `tesco_ie.py` | curl_cffi + BeautifulSoup (Akamai bypass) |
| SuperValu (Energy) | `supervalu_ie.py` | Mercatus API (direct) |
| SuperValu (Soft Drinks) | `supervalu_softdrinks_ie.py` | Mercatus API (direct) |
| Dunnes | `dunnes_ie.py` | curl_cffi + BeautifulSoup (Cloudflare bypass) |
| Aldi | `aldi_ie.py` | Internal JSON API |
| Lidl | `lidl_ie.py` | Internal JSON API |

All scrapers extend `BaseScraper` from `base.py`, which enforces a 2-second delay between requests and provides retry logic with exponential backoff.

### Running Scrapers Locally

```bash
cd scripts/scrapers
pip install -r requirements.txt
SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> python run_scrapers.py
```

The orchestrator (`run_scrapers.py`) runs each scraper, matches products to the database by variant and pack size, then upserts prices using the Supabase service-role key.

### GitHub Actions Schedule

The `scrape-daily.yml` workflow runs at 06:00 UTC every day. It can also be triggered manually via `workflow_dispatch`. The workflow installs Playwright (for Aldi/Lidl browser-based fallback) and uploads logs as artifacts on failure.

## Database Schema

The database uses Postgres with the PostGIS extension for geospatial indexing.

**stores** - Physical store locations with lat/lng coordinates, retailer name, and suburb. Indexed with a GIST spatial index for fast radius queries.

**products** - Monster energy drink variants (Zero Sugar, Ultra White, Ultra Rosa, Ultra Paradise) with pack size (single, 4-pack) and size in ml.

**prices** - Core data table linking stores to products with a price in EUR. Each row tracks its source (`scraper` or `user_upload`) and timestamp. Row Level Security allows public reads and public inserts on prices.

## API Endpoints

### GET /api/prices

Returns prices filtered by location, variant, and pack size.

Query parameters: `lat`, `lng`, `radius` (km), `variant`, `pack_size` (single/4_pack/all), `sort` (price/distance/name)

### POST /api/prices

Submit a user-reported price. Accepts JSON body with `storeName`, `retailer`, `price`, `variant`, `packSize`, `lat`, `lng`, and optional `notes` and `address`.

### GET /api/stores

Returns stores within radius, sorted by distance.

Query parameters: `lat`, `lng`, `radius` (km), `retailer`

### GET /api/health

Returns service health status, data freshness (fresh/stale/outdated based on last scrape time), and record counts. A Vercel cron job pings this endpoint every 3 days to prevent Supabase free-tier pausing.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `bun run lint` and `bun test` before committing
5. Open a pull request

For scraper contributions, extend `BaseScraper` in `scripts/scrapers/`, register your scraper in `run_scrapers.py`, and test locally before submitting.

## License

MIT
