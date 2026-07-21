# ADR-0008: Community Price 7-Day Expiry via SQL Default

**Status**: Accepted  
**Date**: 2026-07-20  
**Driver**: User-submitted prices become stale quickly and need automatic expiration without manual moderation, a cron job, or a TTL service.

## Context

Users can submit prices they spot in stores through the community reporting flow. These prices are valuable but perishable: a shelf price today may not be valid next week. Options considered:

1. **Manual moderation** — an admin reviews every submission and removes stale entries. Accurate but does not scale and creates a backlog.
2. **Scheduled cron job or external TTL service** — periodically deletes or archives expired rows. Adds operational complexity and another service to monitor.
3. **SQL default expiry + RLS filtering** — set a `expires_at` default of `now() + interval '7 days'` on insert, and let RLS and application queries naturally exclude expired rows.

## Decision

Set `user_prices.expires_at` with a SQL default of `now() + interval '7 days'`. RLS policies exclude rows where `expires_at <= now()`, and `mergeUserPrices()` in `lib/prices.ts` only merges unexpired entries. No separate cron job or TTL service is required.

## Rationale

- **Automatic staleness handling**: Every community price self-destructs after 7 days without any application code or scheduler.
- **RLS enforcement**: Expired rows are filtered out at the database access layer, so they cannot leak through the API even if the application code is incomplete.
- **Simple mental model**: Contributors and reviewers know a submitted price lasts exactly one week; there is no ambiguity about when data expires.
- **No extra infrastructure**: The expiry is handled by PostgreSQL defaults and query-time predicates, avoiding cron services or batch jobs.

## Trade-offs

- **Fixed window**: 7 days is a one-size-fits-all duration. Fast-moving promotions or stable long-term prices are treated the same.
- **No hard delete**: Expired rows remain in the table and consume storage until a separate cleanup process is added.
- **No expiry warning**: Users are not notified that their submission is about to expire or that it has expired.
- **Does not apply to scraper prices**: This expiry only affects `user_prices`; automated scraper prices are refreshed daily and have their own freshness semantics.

## Consequences

- `user_prices` table defines `expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days'`.
- RLS policies filter by `expires_at > now()` so expired rows are invisible through the API.
- `mergeUserPrices()` in `lib/prices.ts` checks expiry before merging community prices into the result set.
- `POST /api/prices` is rate-limited to 5 submissions/minute/IP via `checkRateLimitDB()` to limit abuse of the unauthenticated submission flow.
- New stores created from user submissions are flagged `is_approved: false` for moderation before they appear in main results.
- Future storage concerns can be addressed by adding a periodic cleanup job or a hard-delete trigger, but the expiry logic itself remains unchanged.
