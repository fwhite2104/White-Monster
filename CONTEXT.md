# Monster Cork — Domain Glossary

## Pricing models

| Term | Definition | Example retailers |
|------|------------|-------------------|
| **National pricing** | Retailer sets the same price for a product across all physical store locations. One price entry per product covers every store. | Tesco, Dunnes Stores, SuperValu |
| **Per-store pricing** | Individual stores within a retailer can set different prices for the same product. | Lidl, Aldi (prices vary by location in some cases) |

## Store types

| Term | Definition |
|------|------------|
| **Physical store** | A real-world retail location with lat/lng coordinates on the map. Has a unique `stores.id` and a localised address. |
| **National store entry** | A placeholder store record in the `stores` table with name containing "(National)" — exists to link scraped national prices to a known `store_id`. Used as fallback when no physical stores of that retailer are in range. |

## Map

| Term | Definition |
|------|------------|
| **Collapsed card** | A single price list card representing one nationally-priced retailer. Shows retailer badge, price, distance to nearest store, and store count. Tapping opens the detail sheet. |
| **Store popup** | Leaflet popup shown when tapping a map pin. Contains store name, address, distance, price per can, and external directions link. |
| **Marker cluster** | A Leaflet plugin that groups nearby pins into a numbered cluster at zoomed-out levels. Clusters break apart as the user zooms in. |

## Data pipeline

| Term | Definition |
|------|------------|
| **Overpass seed** | A one-off script (re-run monthly via GitHub Actions) that queries the Overpass API to populate `stores` with physical store locations from OpenStreetMap. |
| **Scraper** | Python script that scrapes product prices from a retailer's website/API. Scrapers produce prices, not store locations. |
