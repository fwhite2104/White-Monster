# ADR-0003: PostGIS for Spatial Radius Queries

**Status**: Accepted  
**Date**: 2026-07-20  
**Driver**: Efficiently find stores within a user-specified radius (1–50 km) of a given latitude/longitude.

## Context

The app needs to answer "which stores with prices are near the user?" for every price lookup. The user provides `lat`, `lng`, and a radius between 1 and 50 km. Options considered:

1. **Client-side filtering with `geolib`** — fetch all stores and filter in the browser. Simple, but transfers the entire store catalog and scales poorly as coverage expands beyond Cork.
2. **Geohash-based filtering** — encode locations into geohash prefixes and query by prefix. No PostGIS dependency, but less precise and requires extra indexing/application logic.
3. **PostGIS `ST_DWithin`** — use PostgreSQL's spatial extension with a geography index to filter stores server-side using great-circle distance.

## Decision

Use PostGIS `ST_DWithin` on indexed geography columns for radius filtering. Keep `geolib` only for lightweight client-side distance formatting and validation in `lib/geo.ts`.

## Rationale

- **Scalability**: The spatial index (`idx_stores_location`) means query cost grows with the number of stores in the radius, not the total store count.
- **Accuracy**: `ST_DWithin` with `geography` gives true great-circle distance in meters.
- **Single source of truth**: Filtering happens in the same database query that joins `prices`, `stores`, and `products`.
- **Complement, not conflict**: `geolib` remains useful for client-side distance display and for the query-time expansion in `expandNationalPrices()`, where store coordinates are already in memory.

## Trade-offs

- **PostGIS extension dependency**: The database must have PostGIS enabled. Migration `022_fix_postgis_and_spatial_index.sql` locks down access to PostGIS internals exposed in the `public` schema.
- **Index maintenance**: The functional GIST index on `ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography` must be kept healthy as the store catalog changes.
- **Operational surface**: One more extension to version and secure compared to pure application-level filtering.

## Consequences

- `nearby_prices` RPC (`012_add_nearby_prices_rpc.sql`, updated in `018_update_nearby_prices_rpc_clubcard.sql`) uses `ST_DWithin` for radius filtering and `ST_Distance` for the returned `distance_meters` value.
- `idx_stores_location` GIST index on `stores` makes the radius predicate efficient.
- `lib/geo.ts` wraps `geolib` for client-side distance calculations, not for the primary radius query.
- National placeholder stores are excluded from `nearby_prices` so the RPC returns only physical-store prices; national prices are expanded separately in the API route.
