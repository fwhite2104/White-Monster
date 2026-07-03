# Changelog

## 2026-07-03 — Scraper pipeline hardening (audit-driven)

### Fixed
- **B1** — Silent data corruption from unknown variant fallback. `_extract_variant()` now returns `None` instead of silently mapping unrecognized products to `zero_sugar`. `push_prices()` skips unknown variants with clear `[UNKNOWN_VARIANT]` log. Added 7 new Irish-market variant patterns to both `base.py` and `run_scrapers.py`. (scripts/scrapers/run_scrapers.py, scripts/scrapers/base.py)
- **B2** — Supabase pack_size constraint widened from 3 values to 8 via migration 030. Seed data for all 17 variants × 5 pack sizes via migration 031. RPC updated for generic pack_size via migration 032. (supabase/migrations/030_add_extra_pack_sizes.sql, 031_seed_extra_pack_sizes.sql, 032_generic_pack_size_rpc.sql)
- **B3** — Zero-result alerting added. `run_scrapers.py` now exits non-zero with `[STALE_ALERT]` when ≥50% of retailers return 0 results. Discord notification updated to include failing retailer list. (.github/workflows/scrape-daily.yml)
- **B4/B5/B11** — SuperValu Soft Drinks refactored for consistency. New `SuperValuBaseScraper` base class extracts shared Mercatus API logic (pagination, retry, deal detection, product validation). Both `supervalu_ie.py` and `supervalu_softdrinks_ie.py` now inherit from it. (scripts/scrapers/supervalu_base.py, supervalu_ie.py, supervalu_softdrinks_ie.py)
- **B6** — Dunnes Cloudflare resilience: when `_is_cloudflare_challenge()` detects a block, falls back to Firecrawl instead of returning empty. Dual-failure logged as `[DUNNES_HARD_FAIL]`. (scripts/scrapers/dunnes_ie.py)
- **B7** — `price_history` table now populated on every successful price write. Append-only audit trail enables gap detection and trend charts. (scripts/scrapers/run_scrapers.py)
- **B9** — Centra non-promotional coverage: added sitemap-based product discovery and Firecrawl crawl fallback for base prices. (scripts/scrapers/centra_ie.py)
- **B12** — Firecrawl provider validation: empty or malformed API key produces a clear warning instead of silent failure. `with_firecrawl_fallback()` wrapper enables automatic Firecrawl retry for any bespoke scraper that returns 0 results. (scripts/scrapers/firecrawl_ie.py)
- **Lidl/Aldi selectors** — Removed overly generic CSS selectors (`.product`, `article`, `h2`, `h3`). Added network-response interception for API-level data extraction. Fixed Lidl cookie banner timeout (200ms → 2000ms). Added Firecrawl fallback when both DOM and API extraction fail. (scripts/scrapers/lidl_ie.py, aldi_ie.py)
- **Results tracking** — Structured JSON block printed at end of each run for tooling/CI to parse. (scripts/scrapers/run_scrapers.py)

### Acceptance criteria verified
1. Unrecognized Monster variant → `[UNKNOWN_VARIANT]` skip, never overwrites existing product
2. All pack sizes (`single` through `24_pack`) accepted by products table
3. ≥50% retailer failure → non-zero exit + `[STALE_ALERT]` + Discord notification
4. Firecrawl fallback activates for Dunnes/Lidl/Aldi/Centra when bespoke scraper returns 0
5. `price_history` populated on every upsert
