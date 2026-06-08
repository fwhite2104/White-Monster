# Monster Cork — Predict Analysis Summary

**Date:** 2026-06-06 14:30 UTC
**Scope:** Entire codebase (app/, components/, lib/, hooks/, middleware.ts)
**Goal:** All issues (quality, security, performance, architecture, reliability, UX, DevOps)
**Depth:** Deep (8 personas, 3 rounds)
**Chain:** fix → commit → push → ship

---

## Executive Summary

The Monster Cork web app is a well-structured Next.js 16 application with solid fundamentals (TypeScript strict, validation, rate limiting, error boundaries). However, 8 expert personas identified **12 consensus findings** across critical, high, and medium severity — several of which are architectural issues that compound.

**Top 3 risks:**
1. **Middleware auth refresh is broken** — Supabase session cookies are silently discarded
2. **No CI pipeline** — zero automated quality gates between commit and production
3. **PostGIS installed but unused** — all spatial filtering done in JavaScript

---

## Findings Ranked by Impact

### 🔴 CRITICAL (3 findings)

| # | Finding | Personas | Confidence | Files |
|---|---------|----------|------------|-------|
| 1 | **No CI pipeline for web app** | DevOps, Architect | 98% | `.github/workflows/` |
| 2 | **Middleware discards Supabase session refresh cookies** | Architect, Reliability, DevOps, Security | 95% | `middleware.ts:38` |
| 3 | **CSP allows unsafe-inline and unsafe-eval** | Security, DevOps | 92% | `middleware.ts:39` |

### 🟠 HIGH (6 findings)

| # | Finding | Personas | Confidence | Files |
|---|---------|----------|------------|-------|
| 4 | **PostGIS installed but unused — spatial filtering in JS** | Performance, Architect | 95% | `app/api/prices/route.ts:90-123` |
| 5 | **Race condition: stale API responses overwrite fresh data** | Reliability | 96% | `app/page.tsx:110-113` |
| 6 | **MapErrorBoundary imported but never applied** | Reliability | 98% | `app/page.tsx:24` |
| 7 | **User IP addresses exposed in API responses** | Security | 92% | `app/api/prices/route.ts:221,396` |
| 8 | **BottomTabNav wrong ARIA tab semantics** | UX/Accessibility | 95% | `components/dashboard/BottomTabNav.tsx` |
| 9 | **PriceCard context menu keyboard trap** | UX/Accessibility | 92% | `components/dashboard/PriceCard.tsx` |

### 🟡 MEDIUM (6 findings)

| # | Finding | Personas | Confidence | Files |
|---|---------|----------|------------|-------|
| 10 | **Prices GET handler is 300-line monolith** | Architect, Code Quality | 94% | `app/api/prices/route.ts:53-307` |
| 11 | **God component page.tsx with 18 useState** | Architect, Code Quality, Devil's Advocate | 91% | `app/page.tsx:42-536` |
| 12 | **Duplicate interfaces bypass shared type system** | Code Quality, Architect | 92% | `app/api/prices/route.ts:23-51` |

---

## Anti-Herd Check

**All 8 personas agreed** that the codebase is well-structured with solid fundamentals. The Devil's Advocate provided counter-arguments for every finding:

- **Caching**: No-store is correct for location-dependent queries (cache hit rate near-zero)
- **God component**: 17 useState hooks are mostly UI state, not data-fetching state — current approach is debuggable
- **Leaflet maps**: Core differentiator that spatially differentiates from a "glorified spreadsheet"
- **National price expansion**: Edge cases are hard to express in SQL; O(n*m) is negligible at current scale
- **In-memory rate limiter**: Intentional safety net for 1% Supabase transient failures

---

## Risk Assessment

| Risk Level | Count | Examples |
|------------|-------|----------|
| 🔴 Critical | 3 | No CI, broken auth, weak CSP |
| 🟠 High | 6 | Unused PostGIS, race conditions, IP exposure, a11y failures |
| 🟡 Medium | 6 | Monolith handlers, god component, type duplication |
| 🟢 Low | 0 | — |
| **Total** | **15** | |

**Estimated fix effort:**
- Critical + High: ~2-3 days
- Medium: ~1-2 days
- Total: ~4-5 days

---

## Consensus Recommendations

### Immediate (Critical — fix first)
1. Add CI pipeline (lint + typecheck + test + build)
2. Fix middleware to return `supabaseResponse` instead of new `NextResponse`
3. Remove `unsafe-eval` from CSP script-src

### Short-term (High — fix next)
4. Wrap `storesWithDistance` in `useMemo` (quick win, prevents 80% re-renders)
5. Remove `uploaded_by_ip` from API responses
6. Apply `MapErrorBoundary` around StoreMapBlock
7. Fix BottomTabNav tab semantics (role="tab", aria-selected)
8. Add Escape key handler to PriceCard context menu
9. Create PostGIS RPC function for spatial filtering

### Medium-term (Medium — improve next)
10. Extract price expansion logic from API route into lib/prices.ts
11. Split page.tsx into tab content components
12. Consolidate duplicate interfaces into lib/types.ts
