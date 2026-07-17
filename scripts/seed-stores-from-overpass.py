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
OVERPASS_TIMEOUT = 120  # seconds

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
    """Build an Overpass QL query for a given brand and shop tags."""
    shop_filter = "|".join(shop_tags)
    # Query nodes, ways (out center), and relations (out center) in Ireland
    return f"""
[out:json][timeout:{OVERPASS_TIMEOUT}];
area["ISO3166-1"="IE"]->.searchArea;
(
  nwr["brand"="{brand}"]["shop"~"^{shop_filter}$"](area.searchArea);
);
out center;
"""


def query_overpass(brand: str, shop_tags: List[str]) -> List[Dict]:
    """Query Overpass API and return raw elements."""
    query = build_overpass_query(brand, shop_tags)
    log(f"Querying Overpass for '{brand}' (shop={shop_tags})...")

    try:
        resp = requests.post(
            OVERPASS_URL,
            data={"data": query},
            timeout=OVERPASS_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        elements = data.get("elements", [])
        log(f"  Found {len(elements)} elements for '{brand}'")
        return elements
    except requests.exceptions.Timeout:
        log(f"  Timeout querying '{brand}' — skipping")
        return []
    except requests.exceptions.RequestException as e:
        log(f"  Error querying '{brand}': {e}")
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
            # Some OSM nodes have brand but no name — use brand as fallback
            fallback = f"{brand} {tags.get('addr:city', '')}".strip()
            if not fallback:
                continue
            name = fallback

        # Deduplicate by name within this retailer
        name_lower = name.lower()
        if name_lower in seen_names:
            continue
        seen_names.add(name_lower)

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

            if existing.data:
                # Update existing — preserve is_active and is_approved flags
                supabase.table("stores").update({
                    "lat": store["lat"],
                    "lng": store["lng"],
                    "address": store.get("address"),
                    "suburb": store.get("suburb"),
                    "store_type": store.get("store_type"),
                }).eq("id", existing.data["id"]).execute()
                upserted += 1
            else:
                # Insert new
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
