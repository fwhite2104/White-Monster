# ADR-0004: Two-Tier Rate Limiting (DB-Backed with In-Memory Fallback)

**Status**: Accepted  
**Date**: 2026-07-20  
**Driver**: Protect API endpoints from abuse while keeping the app responsive during Supabase free-tier cold starts or pauses.

## Context

Every API endpoint (`/api/prices`, `/api/stores`, `/api/health`) needs per-IP rate limiting to prevent scraping and spam. Because the project runs on Supabase's free tier, the database can be unreachable during a cold start or after 7 days of inactivity. Options considered:

1. **Pure in-memory rate limiting** — fast and zero dependency, but limits are lost on every Vercel instance and provide no protection across multiple instances.
2. **Redis / external cache** — distributed and fast, but adds a new service, cost, and operational overhead.
3. **DB-backed rate limiting with fallback** — store counts in PostgreSQL for atomic, persistent limits, and fall back to an permissive in-memory result if the DB is unreachable.

## Decision

Use DB-backed rate limiting as the primary mechanism via the `upsert_rate_limit` RPC. If the DB call throws (cold start, pause, or transient failure), `checkRateLimitDB()` in `lib/rate-limit.ts` returns `{ allowed: true, remaining: limit, resetTime: Date.now() + windowMs }` so the request is not hard-blocked by infrastructure issues.

## Rationale

- **Atomicity**: `upsert_rate_limit` uses `INSERT ... ON CONFLICT` on `(ip_address, endpoint, window_start)`, avoiding the race condition of a separate SELECT-then-INSERT.
- **Persistence**: Counts survive across serverless invocations because they live in PostgreSQL.
- **Same infrastructure**: No extra service to provision or pay for.
- **Graceful degradation**: The fallback keeps the app usable when the database is warming up, which is important on a free-tier project.

## Trade-offs

- **DB latency**: Every limited request incurs an RPC round-trip to Supabase.
- **Fallback is permissive**: During a DB outage the app effectively stops rate limiting, which could allow abuse until the DB recovers.
- **No distributed limit across instances**: The fallback is per-instance and temporary; legitimate per-IP enforcement depends on the shared database.
- **Minute-granularity windows**: `window_start` is truncated to the minute, so windows are not perfectly sliding.

## Consequences

- `rate_limits` table created in `029_create_rate_limits_table.sql`.
- `upsert_rate_limit` RPC created in `024_upsert_rate_limit_fn.sql`.
- `lib/rate-limit.ts` exports `checkRateLimitDB()` and `getClientIp()`, which reads `x-real-ip` or `x-forwarded-for`.
- `app/api/prices/route.ts` applies `price-fetch:${ip}` at 60 requests/minute for GET and `price-submit:${ip}` at 5 requests/minute for POST.
- Failed DB rate-limit checks return a 200-equivalent `allowed: true` rather than crashing the request, with normal 429 responses when the DB limit is exceeded.
