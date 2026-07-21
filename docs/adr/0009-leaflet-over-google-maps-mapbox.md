# ADR-0009: Leaflet over Google Maps / Mapbox

**Status**: Accepted
**Date**: 2026-07-20
**Driver**: The app needs an interactive map showing store locations with custom markers, popups, and marker clustering without paying API fees or managing API keys.

## Context

The dashboard includes a map view showing physical store locations near the user. The map must render custom markers per retailer, cluster dense marker groups, display dark-themed popups, and integrate cleanly with Next.js App Router. Options considered:

1. **Google Maps** — rich feature set (satellite, Street View, Places) and familiar UX, but requires an API key, usage-based billing, and restrictive CSP/iframe policies.
2. **Mapbox** — modern vector tiles, excellent styling, but also requires an API key and paid usage tiers beyond a small free volume.
3. **Leaflet + OpenStreetMap tiles** — open-source, no API key, no usage costs, and full control over markers and popups via React wrappers.

## Decision

Use Leaflet rendered through `react-leaflet` with `react-leaflet-cluster` for marker clustering. Load the map client-only via `next/dynamic` with `ssr: false` and use free OpenStreetMap raster tiles.

## Rationale

- **Zero API cost**: OpenStreetMap tiles are free for this use case, and Leaflet itself is open-source. No Google or Mapbox billing account is needed.
- **No key management**: Eliminates API keys from the build pipeline, environment files, and runtime security surface.
- **Full styling control**: Custom `divIcon` markers are built per retailer, popups are styled with Tailwind CSS, and the cluster icon matches the app's green accent color.
- **Simple Next.js integration**: `next/dynamic` with `ssr: false` avoids Leaflet's browser-only DOM dependencies during server rendering, and a `MapErrorBoundary` handles load-time failures gracefully.

## Trade-offs

- **No satellite or Street View**: Google Maps' satellite imagery and Street View are unavailable; OpenStreetMap tiles are standard street maps only.
- **Tile consistency**: OpenStreetMap tile quality and uptime are community-driven and can be less predictable than Mapbox's CDN.
- **No Places integration**: Store address search and autocomplete are not provided; location input relies on manual entry or browser geolocation.
- **Less polished out-of-the-box**: Leaflet requires more custom marker and popup code than Google Maps' default info windows.

## Consequences

- `components/app/StoreMap.tsx` implements the map with `react-leaflet`, `react-leaflet-cluster`, and custom `divIcon` markers.
- `package.json` includes `leaflet`, `react-leaflet`, `react-leaflet-cluster`, and their TypeScript definitions.
- The map is loaded via `next/dynamic` in `app/page.tsx` so it never renders on the server.
- `components/shared/MapErrorBoundary.tsx` catches Leaflet load failures and shows a fallback UI.
- Future needs for satellite imagery or address autocomplete would require revisiting this decision and likely introducing paid API keys.
