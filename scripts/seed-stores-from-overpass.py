#!/usr/bin/env python3
"""Seed physical store locations from OpenStreetMap via the Overpass API.

Queries the Overpass API for all tracked retailers in Ireland, extracts
store locations (name, brand, lat/lng, address), and upserts them into
the Supabase `stores` table.

Run manually:  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... python seed-stores-from-overpass.py
Scheduled via: .github/workflows/seed-stores-monthly.yml (1st of each month)
"""

import json
import os
import sys
import time
from typing import Any, Dict, List

import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
OVERPASS_TIMEOUT = 180  # seconds — some all-Ireland queries take a while

# Ireland bounding box (lat_min, lon_min, lat_max, lon_max)
IE_BBOX = (51.3, -10.6, 55.3, -6.0)

# Retailers to seed, with their OSM brand tag and acceptable shop tags.
# Londis and Costcutter are intentionally excluded (out of scope).
RETAILERS: Dict[str, Dict[str, Any]] = {
    "tesco": {
        "brand": "Tesco",
        "shop_tags": ["supermarket", "convenience"],
    },
    "dunnes": {
        "brand": "Dunnes Stores",
        "shop_tags": ["supermarket"],
    },
    "supervalu": {
        "brand": "SuperValu",
        "shop_tags": ["supermarket"],
    },
    "lidl": {
        "brand": "Lidl",
        "shop_tags": ["supermarket"],
    },
    "aldi": {
        "brand": "Aldi",
        "shop_tags": ["supermarket"],
    },
    "centra": {
        "brand": "Centra",
        "shop_tags": ["convenience", "supermarket"],
    },
    "spar": {
        "brand": "Spar",
        "shop_tags": ["convenience", "supermarket"],
    },
    "dealz": {
        "brand": "Dealz",
        "shop_tags": ["variety_store"],
    },
}


def log(message: str):
    ts = time.strftime("%H:%M:%S")
    print(f"[{ts}] {message}")


def build_overpass_query(brand: str, shop_tags: List[str]) -> str:
    """Build an Overpass QL query for a given brand and shop tags in Ireland."""
    shop_filter = "|".join(shop_tags)
    lat_min, lon_min, lat_max, lon_max = IE_BBOX
    # Query nodes only — the vast majority of Irish retail stores are mapped
    # as nodes. Ways and relations for supermarkets are rare.
    return f"""
[out:json][timeout:{OVERPASS_TIMEOUT}];
node["brand"="{brand}"]["shop"~"^{shop_filter}$"]({lat_min},{lon_min},{lat_max},{lon_max});
out;
"""


def query_overpass(brand: str, shop_tags: List[str]) -> List[Dict]:
    """Query Overpass API and return raw elements.

    Tries the primary query (brand + shop tag). If the shop-tag filter
    causes a timeout, falls back to brand-only query to still get stores
    with missing or non-standard shop tags.
    """
    query = build_overpass_query(brand, shop_tags)
    log(f"Querying Overpass for '{brand}' (shop={shop_tags})...")

    for attempt in range(3):
        try:
            resp = requests.post(
                OVERPASS_URL,
                data={"data": query},
                headers={
                    "Accept": "application/json",
                    "User-Agent": "MonsterIreland/1.0 (Price Comparison Bot; +https://monster-cork.vercel.app)",
                },
                timeout=OVERPASS_TIMEOUT,
            )

            if resp.status_code == 429:
                wait = (attempt + 1) * 10
                log(f"  Rate limited (429) — waiting {wait}s before retry")
                time.sleep(wait)
                continue

            resp.raise_for_status()
            data = resp.json()
            elements = data.get("elements", [])
            log(f"  Found {len(elements)} elements for '{brand}'")
            return elements

        except requests.exceptions.Timeout:
            log(f"  Timeout on attempt {attempt + 1} for '{brand}'")
            if attempt < 2:
                time.sleep(5)
                continue
            # Try brand-only query as fallback
            log(f"  Retrying '{brand}' without shop-tag filter...")
            try:
                fallback_query = f"""
[out:json][timeout:{OVERPASS_TIMEOUT}];
node["brand"="{brand}"]({IE_BBOX[0]},{IE_BBOX[1]},{IE_BBOX[2]},{IE_BBOX[3]});
out;
"""
                resp = requests.post(
                    OVERPASS_URL,
                    data={"data": fallback_query},
                    headers={
                        "Accept": "application/json",
                        "User-Agent": "MonsterIreland/1.0",
                    },
                    timeout=OVERPASS_TIMEOUT,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    elements = data.get("elements", [])
                    log(f"  Brand-only fallback found {len(elements)} elements for '{brand}'")
                    return elements
            except Exception as fe:
                log(f"  Fallback also failed: {fe}")

        except requests.exceptions.RequestException as e:
            log(f"  Error on attempt {attempt + 1}: {e}")
            if attempt < 2:
                time.sleep(5)
                continue
            break

    log(f"  All attempts failed for '{brand}'")
    return []


def extract_stores(brand: str, retailer: str, elements: List[Dict]) -> List[Dict]:
    """Parse Overpass elements into store records for upsert."""
    stores: List[Dict] = []
    seen_names: set = set()

    for el in elements:
        # Get coordinates — nodes have lat/lng directly, ways/relations have center
        lat = el.get("lat")
        lng = el.get("lon")
        if lat is None or lng is None:
            center = el.get("center")
            if center:
                lat = center.get("lat")
                lng = center.get("lon")

        if lat is None or lng is None:
            continue

        # Normalise to float
        try:
            lat = float(lat)
            lng = float(lng)
        except (TypeError, ValueError):
            continue

        # Basic coordinate sanity check (Ireland bounds, roughly)
        if not (51.3 <= lat <= 55.5 and -10.5 <= lng <= -5.5):
            log(f"  Skipping '{brand}' element {el.get('id')}: coords ({lat}, {lng}) outside Ireland")
            continue

        tags = el.get("tags", {})
        name = tags.get("name", "").strip()
        if not name:
            city = tags.get("addr:city", "").strip()
            street = tags.get("addr:street", "").strip()
            location = city or street or f"{lat:.2f},{lng:.2f}"
            name = f"{brand} {location}"

        # Deduplicate by retailer + lat/lng (round to 3 decimal places)
        coord_key = f"{retailer}|{lat:.3f}|{lng:.3f}"
        if coord_key in seen_names:
            continue
        seen_names.add(coord_key)

        # Build address from available addr:* tags
        parts = []
        for key in ["addr:housenumber", "addr:street", "addr:city"]:
            val = tags.get(key, "").strip()
            if val:
                parts.append(val)
        address = ", ".join(parts) if parts else None

        suburb = tags.get("addr:suburb") or tags.get("addr:city") or None

        # Determine store_type from shop tag
        shop = tags.get("shop", "")
        if shop in ("supermarket",):
            store_type = "supermarket"
        elif shop in ("convenience",):
            store_type = "convenience"
        elif shop in ("variety_store",):
            store_type = "other"
        else:
            store_type = None

        stores.append({
            "name": name,
            "retailer": retailer,
            "address": address,
            "suburb": suburb,
            "lat": lat,
            "lng": lng,
            "store_type": store_type,
        })

    return stores


def upsert_stores(supabase, retailer: str, stores: List[Dict]) -> int:
    """Upsert store records into Supabase. Returns count of upserted rows."""
    if not stores:
        return 0

    upserted = 0
    for store in stores:
        try:
            # Check if this store already exists
            existing = (
                supabase.table("stores")
                .select("id, is_active, is_approved")
                .eq("name", store["name"])
                .eq("retailer", retailer)
                .maybe_single()
                .execute()
            )

            if existing and existing.data:
                supabase.table("stores").update({
                    "lat": store["lat"],
                    "lng": store["lng"],
                    "address": store.get("address"),
                    "suburb": store.get("suburb"),
                    "store_type": store.get("store_type"),
                }).eq("id", existing.data["id"]).execute()
                upserted += 1
            else:
                supabase.table("stores").insert({
                    "name": store["name"],
                    "retailer": retailer,
                    "lat": store["lat"],
                    "lng": store["lng"],
                    "address": store.get("address"),
                    "suburb": store.get("suburb"),
                    "store_type": store.get("store_type"),
                    "is_active": True,
                    "is_approved": True,
                }).execute()
                upserted += 1

        except Exception as e:
            log(f"  Error upserting '{store['name']}': {e}")

    return upserted


def main():
    missing = [k for k in ("SUPABASE_URL", "SUPABASE_SERVICE_KEY") if not os.environ.get(k)]
    if missing:
        print(f"ERROR: Missing required environment variables: {', '.join(missing)}")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY before running.")
        sys.exit(1)

    from supabase import create_client

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    log("=== Store Location Seed from OpenStreetMap ===")
    log(f"Targeting {len(RETAILERS)} retailers: {', '.join(RETAILERS.keys())}")

    total_stores = 0

    for retailer, config in RETAILERS.items():
        brand = config["brand"]
        shop_tags = config["shop_tags"]

        log(f"\n--- {brand} ---")
        elements = query_overpass(brand, shop_tags)
        if not elements:
            log(f"  No elements found — skipping")
            continue

        stores = extract_stores(brand, retailer, elements)
        log(f"  Extracted {len(stores)} unique stores from {len(elements)} elements")

        upserted = upsert_stores(supabase, retailer, stores)
        log(f"  Upserted {upserted}/{len(stores)} stores for '{brand}'")
        total_stores += upserted

        # Politeness delay between retailer queries
        time.sleep(2)

    log(f"\n=== Done. {total_stores} total stores seeded/updated ===")


if __name__ == "__main__":
    main()
