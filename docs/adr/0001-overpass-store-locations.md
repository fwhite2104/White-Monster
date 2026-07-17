# ADR-0001: Overpass API for physical store locations

**Status**: Accepted  
**Date**: 2026-07-17  
**Driver**: Need to show real store pins for nationally-priced retailers (Tesco, Dunnes, SuperValu) on the map

## Context

The app tracks prices across 11 Irish retailers. For retailers with per-store pricing (Aldi, Lidl), physical store locations are seeded manually in SQL migrations. For nationally-priced retailers (Tesco, Dunnes, SuperValu), only a single "(National)" placeholder store existed — prices are identical across all locations, so the scrapers only needed one store_id to link prices to.

Adding a map feature that shows all physical store locations exposed a data gap: there are no real Tesco, Dunnes, or SuperValu store coordinates in the database. Options to populate them:

1. **Manual SQL migration** — write INSERT statements for every store. Accurate but labour-intensive. ~800-1,200 stores across all retailers.
2. **Store-finder scrapers** — scrape each retailer's store-locator website. Requires anti-bot measures per site, maintenance burden.
3. **Overpass API** — query OpenStreetMap's community-maintained dataset for supermarket/convenience stores by brand. Free, no API key, one query covers all retailers.

## Decision

Use Overpass API to seed physical store locations. Run as a one-off seed script, then re-run monthly via GitHub Actions to capture new store openings.

## Rationale

- **Coverage**: OpenStreetMap has comprehensive Irish retail data. The community-maintained dataset is sufficiently accurate for store locations.
- **Cost**: Free, no API key, no rate limits at this query volume (one batch query per month).
- **Maintenance**: Zero ongoing maintenance — OSM contributors keep locations current. Monthly re-scrape keeps the DB in sync.
- **Simplicity**: One query, one script, one cron trigger. No per-retailer anti-bot measures, no HTML parsing, no API contracts to version.

## Trade-offs

- **Accuracy**: OSM data may occasionally be stale or incorrect. Mitigated by monthly re-scrape (wrong locations get corrected within a month).
- **Address granularity**: OSM's `addr:*` tags vary in completeness. Some stores may lack suburb/address. Mitigated by using lat/lng as the primary identifier — address is a nice-to-have for popups.
- **Scope**: Overpass doesn't distinguish between "Tesco Superstore" and "Tesco Express" cleanly. We accept this — both are valid store locations for price lookup.

## Consequences

- `expandNationalPrices()` in `lib/prices.ts` automatically maps national prices to real physical stores once they exist.
- National price query (`LIKE '%(National)%'`) and fallback logic preserved for areas with no physical store coverage.
- Monthly GitHub Actions workflow added: `seed-stores-monthly.yml`.
- Londis and Costcutter explicitly excluded from the initial seed (out of scope).
