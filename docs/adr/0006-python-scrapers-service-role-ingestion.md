# ADR-0006: Python Scrapers with Service-Role Ingestion Pipeline

**Status**: Accepted  
**Date**: 2026-07-20  
**Driver**: The app needs daily price data from 11+ Irish retailer websites/APIs, many with anti-bot measures, dynamic rendering, and rate-limiting requirements.

## Context

The web app is TypeScript/Next.js, but the ingestion pipeline needs to scrape 11 Irish retailers daily. Many sites use anti-bot protection (Akamai, Cloudflare), dynamic JavaScript rendering, or undocumented JSON APIs. Options considered:

1. **TypeScript/Node.js scrapers** — same language as the web app, but the scraping ecosystem is weaker than Python's and TLS-fingerprint impersonation tools are harder to come by.
2. **Python scrapers with a separate ingestion API** — Python is the standard for scraping, but adds a service to host and secure.
3. **Python scrapers as a backend ingestion pipeline running in GitHub Actions** — Python scripts run on a schedule, connect directly to Supabase with a service-role key, and upsert prices. No separate hosting; the CI runner is the only runtime.

## Decision

Run a polyglot pipeline: the web app stays TypeScript/Next.js, while data ingestion is implemented as Python 3 scripts under `scripts/scrapers/`. The orchestrator `run_scrapers.py` creates a Supabase client with `SUPABASE_SERVICE_KEY` and upserts prices directly. The workflow runs daily at 09:00 UTC via `.github/workflows/scrape-daily.yml`.

## Rationale

- **Ecosystem**: Python has mature scraping libraries (`curl_cffi`, `requests`, `BeautifulSoup`, `Firecrawl`) and pre-built TLS fingerprint impersonation for Akamai/Cloudflare.
- **No extra hosting**: GitHub Actions provides the runtime; the scripts run on a schedule and exit when done.
- **Direct DB ingestion**: The service-role key lets the scrapers bypass RLS and upsert prices atomically without needing a custom API layer.
- **Retailer-specific tactics**: Different retailers use different strategies — `curl_cffi` for Tesco and Dunnes, direct API requests for Aldi, Lidl, and SuperValu, and Firecrawl as a fallback for retailers where bespoke scrapers return no results.

## Trade-offs

- **Polyglot overhead**: The repo now contains two runtimes, two dependency sets, and two sets of conventions. Contributors must understand both sides.
- **Service-role key power**: `SUPABASE_SERVICE_KEY` bypasses RLS. It must be kept CI-only and never exposed to the client or the browser bundle.
- **CI dependency**: Daily ingestion depends on GitHub Actions being available. If Actions is delayed or fails, prices go stale.
- **No live scraping on demand**: The pipeline is batch-based; users cannot trigger a fresh scrape from the web app.
- **Unpinned Python dependencies**: `requirements.txt` uses `>=` ranges without a lock file, so future builds may drift.

## Consequences

- `scripts/scrapers/` contains Python scrapers with their own `requirements.txt` and `AGENTS.md` documentation.
- `base.py` defines `BaseScraper` with configurable delay (default 2s), exponential backoff, and retry logic.
- `run_scrapers.py` is the orchestrator that runs all registered scrapers and upserts results to Supabase.
- `lib/supabase/server.ts` and `lib/supabase/client.ts` use the anon key for RLS-gated web requests; the scrapers use the service-role key for ingestion only.
- `.github/workflows/scrape-daily.yml` runs the pipeline at 09:00 UTC using repository secrets.
- Security review must treat `SUPABASE_SERVICE_KEY` as a production secret and ensure it never appears in client-side code or logs.
