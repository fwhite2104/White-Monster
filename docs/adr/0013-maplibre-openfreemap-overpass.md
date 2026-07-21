# ADR-0013: MapLibre GL + OpenFreeMap vector tiles + Overpass places

**Status**: Proposed
**Date**: 2026-07-21
**Supersedes**: ADR-0009 (Leaflet + OSM raster tiles)

## Context

The existing map (ADR-0009) uses Leaflet with OpenStreetMap raster tiles and store locations from the app's PostGIS database. This has several problems:

1. **OSM raster tiles look dated** — pixelated at zoom levels, no 3D buildings, no terrain, labels are basic. The map reads as "tacked-on" rather than a polished product feature.
2. **Store locations in DB are inaccurate** — many lat/lng coordinates for stores don't render on the map correctly, and maintaining accurate locations for 11 retailers across Ireland is a continuous maintenance burden.
3. **No POI/places search** — the map only shows stores the app already knows about. There's no way to discover new, nearby retailers or contextual POIs.
4. **Geolocation defaults to Dublin** — users outside Cork see incorrect centering and no nearby data.

The requirements for a replacement:
- Free (no credit card), no ongoing API costs
- No API key management in build/runtime
- Vector tiles that look modern (rival Google Maps quality)
- Can find actual store locations for major Irish retailers (Tesco, Dunnes, SuperValu, Lidl, Aldi, etc.)
- Self-hostable as a future option
- "Get Directions" must continue working (Google Maps / Apple Maps deep links)

## Options Considered

### Map Tiles

1. **OpenFreeMap + MapLibre GL JS** — Free vector tiles, no registration, no rate limits, no API keys. Based on OpenMapTiles schema. Self-hostable (MIT license). Multiple styles (Liberty, Dark, Positron, Fiord, 3D). Public instance at `tiles.openfreemap.org` with no usage caps. Requires MapLibre GL JS as the renderer.

2. **Geoapify Map Tiles** — 3,000 credits/day free tier, no credit card. Vector tiles. Rate-limited to 5 req/s. Requires account registration. "Soft" daily quota (they don't hard-block but may ask to upgrade).

3. **Google Maps Demo Key** — No credit card, but limited usage and only for prototyping. Nearby Search is marked "pro" and likely unavailable on the demo key. Production requires a paid account with billing.

4. **LatLng Tiles API** — Leaflet raster tiles, 500 req/day limit on places. Low limit for production.

### Places / POI Data

1. **Overpass API (OpenStreetMap)** — Completely free, no API key. Excellent Irish coverage for retail locations. ~10k queries/day free on the main instance. Britain & Ireland specific instance available. Self-hostable (AGPL v3). Requires learning Overpass QL query language.

2. **Geoapify Places API** — Included in the same 3k credit/day pool. Simpler REST API. Same OSM data underneath. Requires API key.

3. **LatLng Places API** — 500 requests/day free, no credit card. Simple REST. Same OSM data. Low limit.

4. **Google Places API (Nearby Search)** — Best data quality. Unavailable on demo key. Requires billing for production.

## Decision

**MapLibre GL JS** for rendering + **OpenFreeMap** public instance for vector tiles + **Overpass API** for places/POI data.

This is a two-part change:
- **Map rendering**: Leaflet → MapLibre GL JS with OpenFreeMap vector tiles
- **Store locations**: PostGIS DB query → Overpass API live queries by brand name at view time

## Rationale

- **$0 cost**: OpenFreeMap has no usage limits or registration. Overpass API is free with generous limits (~10k queries/day). No API keys to manage.
- **Vector tile quality**: OpenFreeMap tiles (Liberty style) are visually competitive with Google Maps — smooth labels, building footprints, road hierarchy, landuse colours. Multiple style themes available.
- **Better Irish store data**: OSM has comprehensive coverage of Irish retail chains. Querying by brand name (`name~"Tesco"`) returns actual locations with accurate coordinates, opening hours, and addresses — solving the inaccurate DB locations problem.
- **POI discovery**: Overpass can find any OSM-tagged POI (shops, restaurants, pubs, pharmacies) within a radius, enabling category-based browsing.
- **Self-hostable**: Both OpenFreeMap and Overpass API are open-source and can run on dedicated servers if the public instances become insufficient.
- **Directions preserved**: The "Get Directions → Google Maps" deep link in popups is unchanged.
- **Existing Overpass usage**: The codebase already uses Overpass API for the monthly store seeding script (see "Overpass seed" in CONTEXT.md). Adding runtime Overpass queries builds on existing knowledge.

## Trade-offs

- **Overpass query latency**: Live queries take 1–3 seconds depending on radius and result count. The Leaflet/DB approach was instant. Mitigation: cache results client-side with a short TTL, or batch queries.
- **Rate limits on Overpass**: The main instance recommends <10k queries/day and <1GB/day. For a single-user app this is generous, but high-traffic scenarios may require self-hosting an Overpass instance or switching to the Britain & Ireland instance.
- **No satellite imagery**: OpenFreeMap offers street maps only, same as OSM. Satellite view would require a paid provider.
- **Larger JS bundle**: MapLibre GL JS (~800KB gzipped) is larger than Leaflet (~40KB). Mitigation: continue using `next/dynamic` with `ssr: false` as done currently.
- **No built-in marker clustering**: MapLibre doesn't have a first-party cluster plugin equivalent to `react-leaflet-cluster`. Mitigation: use MapLibre's built-in GeoJSON source clustering or a lightweight wrapper.

## Consequences

- `components/map/StoreMapBlock.tsx` will be rewritten to use MapLibre GL JS instead of `react-leaflet`.
- `package.json` will add `maplibre-gl` and remove `leaflet`, `react-leaflet`, `react-leaflet-cluster`.
- A new `lib/overpass.ts` module will handle Overpass QL query building and response parsing.
- Store locations will come from Overpass by brand name at render time, replacing the PostGIS `nearby_prices` RPC for the map view. The DB stores table will be retained for price data association but the map will not rely on its coordinates.
- Map centering will use browser geolocation with a fallback to a reasonable Ireland center (not Cork, since users reported incorrect defaulting).
- Category filter UI (Shops, Supermarkets, Food & Drink, Services) will be added above the map.
- A standalone Vite + React prototype (`map-prototype/`) has been built to validate the stack before porting to the Next.js app.
