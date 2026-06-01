#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timezone
from typing import List, Dict

from supabase import create_client, Client
from base import BaseScraper
# DISABLED: from lidl_ie import LidlIEScraper
# DISABLED: from aldi_ie import AldiIEScraper
from tesco_ie import TescoIEScraper
from supervalu_ie import SuperValuIEScraper
from supervalu_softdrinks_ie import SuperValuSoftDrinksScraper
from dunnes_ie import DunnesIEScraper

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]


def _extract_variant(product_name: str) -> str:
    """Extract the Monster variant keyword from a scraped product name.

    Args:
        product_name: The scraped product name (e.g., 'Monster Ultra White')

    Returns:
        One of: 'zero_sugar', 'ultra_white', 'ultra_rosa', 'ultra_paradise'
        Falls back to 'zero_sugar' (most common variant).
    """
    lowered = product_name.lower()

    # "zero sugar" or "white zero" -> zero_sugar
    if "zero sugar" in lowered or "white zero" in lowered:
        return "zero_sugar"

    # "ultra white" -> ultra_white (but NOT if "ultra rosa" or "ultra paradise" present)
    if "ultra white" in lowered and "ultra rosa" not in lowered and "ultra paradise" not in lowered:
        return "ultra_white"

    # "ultra rosa" or just "rosa" -> ultra_rosa
    if "ultra rosa" in lowered or "rosa" in lowered:
        return "ultra_rosa"

    # "ultra paradise" or just "paradise" -> ultra_paradise
    if "ultra paradise" in lowered or "paradise" in lowered:
        return "ultra_paradise"

    # Fallback: most common variant
    return "zero_sugar"


def get_or_create_store(
    supabase: Client, retailer: str, name: str, lat: float, lng: float, suburb: str
) -> str:
    result = (
        supabase.table("stores")
        .select("id")
        .eq("retailer", retailer)
        .eq("name", name)
        .execute()
    )
    if result.data:
        return result.data[0]["id"]
    result = (
        supabase.table("stores")
        .insert({
            "name": name,
            "retailer": retailer,
            "lat": lat,
            "lng": lng,
            "suburb": suburb,
            "address": "National pricing",
        })
        .execute()
    )
    return result.data[0]["id"]


def push_prices(
    supabase: Client, prices: List[Dict], retailer: str, store_id: str
):
    for p in prices:
        variant = _extract_variant(p["product_name"])
        pack_size = BaseScraper._detect_pack_size(p["product_name"])

        if pack_size == "unknown":
            pack_size = "single"

        product_result = (
            supabase.table("products")
            .select("id")
            .eq("variant", variant)
            .eq("pack_size", pack_size)
            .execute()
        )

        if not product_result.data:
            print(f"  [WARN] No product matched for '{p['product_name']}' (variant={variant}, pack_size={pack_size})")
            continue

        product_id = product_result.data[0]["id"]
        print(f"  Matched '{p['product_name']}' -> product_id={product_id}")

        existing = (
            supabase.table("prices")
            .select("id")
            .eq("store_id", store_id)
            .eq("product_id", product_id)
            .eq("source", "scraper")
            .execute()
        )
        now = datetime.now(timezone.utc).isoformat()

        if existing.data:
            (
                supabase.table("prices")
                .update({"price": p["price"], "scraped_at": now})
                .eq("id", existing.data[0]["id"])
                .execute()
            )
        else:
            (
                supabase.table("prices")
                .insert({
                    "store_id": store_id,
                    "product_id": product_id,
                    "price": p["price"],
                    "source": "scraper",
                    "scraped_at": now,
                })
                .execute()
            )
        print(f"  {p['product_name']}: EUR {p['price']}")


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print(f"=== Monster Cork Scraper === {datetime.now(timezone.utc).isoformat()}")

    print("\n--- Lidl Ireland --- SKIPPED (API DNS resolution error - domain no longer resolves)")

    print("\n--- Aldi Ireland --- SKIPPED (API 403 Forbidden - Akamai blocked)")

    print("\n--- Tesco Ireland ---")
    tesco_prices = TescoIEScraper().scrape()
    tesco_store = get_or_create_store(
        supabase, "tesco", "Tesco Ireland (National)", 51.8985, -8.4756, "Cork City"
    )
    push_prices(supabase, tesco_prices, "tesco", tesco_store)

    print("\n--- SuperValu Ireland (Sports & Energy) ---")
    supervalu_prices = SuperValuIEScraper().scrape()
    supervalu_store = get_or_create_store(
        supabase, "supervalu", "SuperValu Ireland (National)", 51.8985, -8.4756, "Cork City"
    )
    push_prices(supabase, supervalu_prices, "supervalu", supervalu_store)

    print("\n--- SuperValu Ireland (Soft Drinks - 4 Packs) ---")
    supervalu_sd_prices = SuperValuSoftDrinksScraper().scrape()
    supervalu_sd_store = get_or_create_store(
        supabase, "supervalu", "SuperValu Ireland Soft Drinks (National)", 51.8985, -8.4756, "Cork City"
    )
    push_prices(supabase, supervalu_sd_prices, "supervalu", supervalu_sd_store)

    print("\n--- Dunnes Stores Ireland ---")
    dunnes_prices = DunnesIEScraper().scrape()
    dunnes_store = get_or_create_store(
        supabase, "dunnes", "Dunnes Stores Ireland (National)", 51.8985, -8.4756, "Cork City"
    )
    push_prices(supabase, dunnes_prices, "dunnes", dunnes_store)

    total = len(tesco_prices) + len(supervalu_prices) + len(supervalu_sd_prices) + len(dunnes_prices)
    print(f"\nDone. Total: {total} prices")


if __name__ == "__main__":
    main()
