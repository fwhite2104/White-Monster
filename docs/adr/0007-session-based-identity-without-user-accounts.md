# ADR-0007: Session-Based Identity Without User Accounts

**Status**: Accepted  
**Date**: 2026-07-20  
**Driver**: Users need to set price alerts, save favorites, and submit community prices without the friction of signing up for an account.

## Context

The app supports personalized features — price alerts, favorites, and community price submissions — but it intentionally has no authentication system. Options considered:

1. **Full user accounts with email/password or OAuth** — cross-device persistence, accurate identity, but adds sign-up friction, password management, GDPR obligations, and email verification.
2. **Anonymous Supabase auth** — lets Supabase issue a session ID without user input, but still ties data to an auth system and complicates account recovery.
3. **Session/IP-based identity without accounts** — use the browser session and request IP as the identity boundary for RLS; no sign-up, no auth client state.

## Decision

Use session-based identity without accounts. The middleware initializes the Supabase SSR client and calls `supabase.auth.getUser()`, but it catches failure silently and does not require authentication. RLS policies on `user_prices`, `user_favorites`, and `price_alerts` use session ID or IP-based access controls rather than `user_id`. Community submissions via `POST /api/prices` record `uploaded_by_ip` and a session identifier.

## Rationale

- **Zero friction**: Users can submit prices or save favorites immediately without sign-up, which matches the "open the app and use it" intent.
- **No auth infrastructure**: No password hashing, email verification, OAuth providers, or account recovery flows to maintain.
- **Reduced compliance surface**: Avoiding user accounts sidesteps the GDPR complexity of storing email addresses and personal profiles.
- **Good enough for the use case**: Favorites and alerts are transient helpers; the core value is price comparison, not cross-device personalization.

## Trade-offs

- **No cross-device persistence**: Data lives with the session. Clearing cookies or switching devices loses favorites, alerts, and submission history.
- **IP-based identity is imprecise**: NAT, VPNs, mobile carriers, and dynamic IP allocation mean the same user may appear as different IPs, and different users may share an IP.
- **Limited moderation**: Without accounts, bad-faith submissions are harder to trace or ban at a user level; rate limiting and store approval are the main defenses.
- **No ownership transfer**: Users cannot reclaim their favorites or alerts if they lose their session.

## Consequences

- `middleware.ts` exists mainly for security headers (CSP, HSTS, X-Frame-Options); the Supabase auth check is defensive and non-blocking.
- `user_prices`, `user_favorites`, and `price_alerts` are RLS-protected by session/IP rather than by `user_id`.
- `POST /api/prices` inserts `user_prices` rows with `uploaded_by_ip` and a session identifier, plus a 7-day `expires_at` default.
- The data model and API must treat identity as best-effort, not authoritative, and avoid features that require strong identity guarantees.
- Any future move to real accounts will require a migration path to associate session data with verified users.
