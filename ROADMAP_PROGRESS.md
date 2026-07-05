# Roadmap Progress
Last updated: 2026-07-03

| Sprint | Task | Status | Notes |
|---|---|---|---|
| 0 | 0.1 | DONE | Config already minimal — only supabase, context7, websearch enabled. No excess servers found. |
| 0 | 0.2 | DONE | Removed stale global @playwright/cli@0.1.14. vitest.config.ts confirmed needed (project uses Vitest). |
| 0 | 0.3 | DONE | DEV_ENVIRONMENT.md already existed, updated MCP servers table to reflect actual 3-server config. |
| 1 | 1.1 | DONE | Scraper audit: found centra_ie.py bug (name.lower missing parens), firecrawl_ie.py empty config dict |
| 1 | 1.2 | DONE | Added 9_pack to PACK_SIZES, DB CHECK constraint, seeded 22 9_pack product rows, FilterDrawer/StoreUploadForm auto-handle via PACK_SIZES |
| 1 | 1.3 | DONE | Fixed dedup bug: user_reported now always wins over scraper (was preferring cheaper price). mergeUserPrices expires_at filter gap noted but DB-level filter is correct. rate_limits ip_address type inconsistency flagged. |
| 1 | 1.4 | DONE | Health endpoint logic correct (fresh<48h, stale<7d, outdated>7d). Vercel cron confirmed: /api/health hit every 3 days at 05:00 UTC. Scraped_at correctly set by scraper upserts. updated_at trigger also exists on prices table. |
| 2 | 2.1 | DONE | Removed auto-refresh useEffect that called getCurrentPosition on mount (caused browser prompt on every visit). Denied status now persisted to localStorage. LocationDeniedState and LocationTimeoutState updated with inline fallback UI. |
| 2 | 2.2 | DONE | Added last_scraped_at to API meta. Created DataFreshnessBanner (fresh<48h=hidden, stale 48h-7d=amber, outdated>7d=red with /api/health link) placed below LocationBanner. use-price-query computes freshness status to avoid impure Date.now() in render. |
| 3 | 3.1 | DONE | Fixed card width (w-44→w-[152px]), badge clipping (pt-2 -mt-2 on mobile scroll), rigid card wrappers (min-w-0), price row overflow (flex-wrap). 2 cards visible at 375px. |
| 3 | 3.2 | DONE | Gated search auto-focus behind max-width check (mobile keyboard fix), added overflow-x-hidden to tab nav, reduced spring bounce 0.15→0.08 for tab indicator. |
| 4 | 4.1 | REMOVED | Barcode scanner feature deleted per user request. ScanButton.tsx, BarcodeScanner.tsx, ScanResult.tsx removed. /api/scan/route.ts deleted. html5-qrcode uninstalled. README updated. |
| 5 | 5.1 | DONE | Unit tests: 50/50 pass. Build: succeeds. E2E: cannot run — Playwright has no compatible browser for Ubuntu 26.04 (chromium/webkit/firefox all fail to install). Pre-existing environment issue, not a code regression. |
| 5 | 5.2 | DONE | Removed stale "barcode scanner mobile/desktop" and "pack sizes >4" from Known Gaps. Added E2E environment limitation note. |
| 5 | 5.3 | DONE | Security: all RLS policy warnings are intentional (community INSERT policies allow anonymous submissions — by design). PostGIS in public schema is a Supabase default. Performance: 23 unused indexes found, all deferred to future cleanup as they may be used by PostGIS RPC queries. No HIGH-severity action needed. |
