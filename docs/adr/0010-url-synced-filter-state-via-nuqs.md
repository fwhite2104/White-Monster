# ADR-0010: URL-Synced Filter State via nuqs

**Status**: Accepted
**Date**: 2026-07-20
**Driver**: Dashboard filters (variant, sort, pack size, radius, geolocation) must be shareable via URL, persistent across reloads, and kept in sync with React state without adding a dedicated state management library.

## Context

The dashboard exposes multiple filter axes: Monster variant, sort order, pack size, and search radius. Location is also surfaced through `lat` and `lng` query parameters. The state must be:

- **Shareable**: a user can copy the URL and share the exact same view.
- **Persistent**: refreshing the page restores the previous filter selection.
- **Lightweight**: no complex global store or boilerplate for serializing/deserializing state.

Options considered:

1. **React Context + useState** — simple to set up, but state is lost on reload and cannot be shared via URL.
2. **Zustand / Redux with persistence** — gives structured state and persistence, but adds a store, hydration logic, and still requires manual URL sync for shareability.
3. **URL search params via `nuqs`** — maps filter state directly to Next.js search params, giving shareability and persistence for free.

## Decision

Sync filter state directly to URL search parameters using `nuqs`. Use `useQueryStates` in `hooks/use-price-query.ts` for variant, pack size, sort, and radius, and wrap the app with `NuqsAdapter` in `app/layout.tsx`.

## Rationale

- **Built-in shareability and persistence**: every filter change is reflected in the URL, so copying the URL or refreshing the page preserves the exact view.
- **No state management library needed**: `nuqs` replaces the need for Zustand, Redux, or Context for filter state, keeping the dependency tree small.
- **Next.js App Router integration**: `nuqs` works with App Router search params and adapters, so server/client coordination is handled by the library.
- **Type-safe parsing**: `parseAsString` and `parseAsInteger` provide validated defaults and typed state values.

## Trade-offs

- **URL length limits**: very large or complex filter payloads could exceed browser URL limits; string-based serialization is not ideal for deeply nested state.
- **Additional dependency**: `nuqs` is a focused package, but it is still an extra dependency compared to plain React state.
- **No compression**: URL-encoded state is human-readable, but large payloads are not compressed. If filters grow significantly, a compressed state scheme would be needed.
- **Public by default**: filter state is visible in the URL, which is fine for product preferences but would be unsuitable for sensitive data.

## Consequences

- `hooks/use-price-query.ts` defines `priceParams` and uses `useQueryStates` to keep variant, sort, pack size, and radius in sync with the URL.
- `app/layout.tsx` wraps the application in `NuqsAdapter` from `nuqs/adapters/next/app`.
- `components/app/FilterBar.tsx` receives the current filter values and setters, driving the UI controls while `nuqs` handles serialization.
- `package.json` pins `nuqs` as a dependency.
- No global state store is required for filters; location remains handled by the browser geolocation hook and URL params.
- Adding new filter axes means adding another `nuqs` parser, not extending a store schema.
