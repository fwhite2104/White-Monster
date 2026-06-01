#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timezone
from typing import List, Dict

from supabase import create_client, Client
from base import BaseScraper
from lidl_ie import LidlIEScraper
from aldi_ie import AldiIEScraper
from tesco_ie import TescoIEScraper
from supervalu_ie import SuperValuIEScraper
from supervalu_softdrinks_ie import SuperValuSoftDrinksScraper
from dunnes_ie import DunnesIEScraper
from centra_ie import CentraIEScraper

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]


def _log(message: str):
    ts = datetime.now(timezone.utc).isoformat()
    print(f"[{ts}] {message}")


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
        if not BaseScraper._validate_product(p):
            print(f"  [WARN] Skipping invalid product: {p}")
            continue

        # Validate scraped product before processing
        if not isinstance(p, dict):
            print(f"  [WARN] Skipping invalid product (not a dict): {p}")
            continue
        if not p.get("product_name") or not isinstance(p.get("product_name"), str) or not p["product_name"].strip():
            print(f"  [WARN] Skipping product with missing/empty name")
            continue
        if not isinstance(p.get("price"), (int, float)) or p["price"] <= 0:
            print(f"  [WARN] Skipping product with invalid price: {p.get('price')}")
            continue
        if p["price"] > 100:
            print(f"  [WARN] Skipping product with suspicious price > 100 EUR: {p['price']}")
            continue

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
    required_env = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
    missing = [k for k in required_env if not os.environ.get(k)]
    if missing:
        print(f"ERROR: Missing required environment variables: {', '.join(missing)}")
        print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY before running.")
        sys.exit(1)

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    _log("=== Monster Cork Scraper ===")

    _log("--- Lidl Ireland ---")
    try:
        lidl_prices = LidlIEScraper().scrape()
        lidl_store = get_or_create_store(
            supabase, "lidl", "Lidl Ireland (National)", 51.8985, -8.4756, "Cork City"
        )
        push_prices(supabase, lidl_prices, "lidl", lidl_store)
    except Exception as e:
        _log(f"  [WARN] Lidl scraper failed: {e}")
        lidl_prices = []

    _log("--- Aldi Ireland ---")
    try:
        aldi_prices = AldiIEScraper().scrape()
        aldi_store = get_or_create_store(
            supabase, "aldi", "Aldi Ireland (National)", 51.8985, -8.4756, "Cork City"
        )
        push_prices(supabase, aldi_prices, "aldi", aldi_store)
    except Exception as e:
        _log(f"  [WARN] Aldi scraper failed: {e}")
        aldi_prices = []

    _log("--- Tesco Ireland ---")
    try:
        tesco_prices = TescoIEScraper().scrape()
        tesco_store = get_or_create_store(
            supabase, "tesco", "Tesco Ireland (National)", 51.8985, -8.4756, "Cork City"
        )
        push_prices(supabase, tesco_prices, "tesco", tesco_store)
    except Exception as e:
        _log(f"  [WARN] Tesco scraper failed: {e}")
        tesco_prices = []

    _log("--- SuperValu Ireland (Sports & Energy) ---")
    try:
        supervalu_prices = SuperValuIEScraper().scrape()
        supervalu_store = get_or_create_store(
            supabase, "supervalu", "SuperValu Ireland (National)", 51.8985, -8.4756, "Cork City"
        )
        push_prices(supabase, supervalu_prices, "supervalu", supervalu_store)
    except Exception as e:
        _log(f"  [WARN] SuperValu scraper failed: {e}")
        supervalu_prices = []

    _log("--- SuperValu Ireland (Soft Drinks - 4 Packs) ---")
    try:
        supervalu_sd_prices = SuperValuSoftDrinksScraper().scrape()
        push_prices(supabase, supervalu_sd_prices, "supervalu", supervalu_store)
    except Exception as e:
        _log(f"  [WARN] SuperValu Soft Drinks scraper failed: {e}")
        supervalu_sd_prices = []

    _log("--- Dunnes Stores Ireland ---")
    try:
        dunnes_prices = DunnesIEScraper().scrape()
        dunnes_store = get_or_create_store(
            supabase, "dunnes", "Dunnes Stores Ireland (National)", 51.8985, -8.4756, "Cork City"
        )
        push_prices(supabase, dunnes_prices, "dunnes", dunnes_store)
    except Exception as e:
        _log(f"  [WARN] Dunnes scraper failed: {e}")
        dunnes_prices = []

    _log("--- Centra Ireland ---")
    try:
        centra_prices = CentraIEScraper().scrape()
        centra_store = get_or_create_store(
            supabase, "centra", "Centra Ireland (National)", 51.8985, -8.4756, "Cork City"
        )
        push_prices(supabase, centra_prices, "centra", centra_store)
    except Exception as e:
        _log(f"  [WARN] Centra scraper failed: {e}")
        centra_prices = []

    results = {}
    for name, prices in [
        ("Lidl", lidl_prices),
        ("Aldi", aldi_prices),
        ("Tesco", tesco_prices),
        ("SuperValu", supervalu_prices),
        ("SuperValu Soft Drinks", supervalu_sd_prices),
        ("Dunnes", dunnes_prices),
        ("Centra", centra_prices),
    ]:
        results[name] = len(prices) if prices else "FAILED"

    print(f"\n=== Scraper Results Summary ===")
    for name, count in results.items():
        status = f"{count} prices" if count != "FAILED" else "FAILED"
        print(f"  {name}: {status}")
    total = sum(v for v in results.values() if isinstance(v, int))
    print(f"  Total: {total} prices")


if __name__ == "__main__":
    main()
