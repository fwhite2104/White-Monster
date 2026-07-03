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

# Firecrawl-backed scraper — only active when FIRECRAWL_API_KEY is set.
FirecrawlScraper: type | None = None
FIRECRAWL_RETAILERS: dict = {}
_HAS_FIRECRAWL = False
try:
    from firecrawl_ie import FirecrawlScraper as _FcScraper, FIRECRAWL_RETAILERS as _FcRetailers
    FirecrawlScraper = _FcScraper
    FIRECRAWL_RETAILERS = _FcRetailers
    _HAS_FIRECRAWL = True
except ImportError:
    pass

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]


def _log(message: str):
    ts = datetime.now(timezone.utc).isoformat()
    print(f"[{ts}] {message}")


def _extract_variant(product_name: str) -> str | None:
    """Extract the Monster variant keyword from a scraped product name.

    Args:
        product_name: The scraped product name (e.g., 'Monster Ultra White')

    Returns:
        One of the 17 supported variant slugs, or None if unrecognized.
    """
    lowered = product_name.lower()

    # Lando Norris (check before ultra/zero to avoid misclassification)
    if "lando norris" in lowered:
        return "lando_norris"

    # Viking Berry (check before other fruit variants)
    if "viking berry" in lowered:
        return "viking_berry"

    # Mango Loco
    if "mango loco" in lowered:
        return "mango_loco"

    # Pipeline Punch
    if "pipeline punch" in lowered:
        return "pipeline_punch"

    # Rio Punch
    if "rio punch" in lowered:
        return "rio_punch"

    # Hydro Watermelon
    if "hydro" in lowered and "watermelon" in lowered:
        return "hydro_watermelon"

    # Assault
    if "assault" in lowered:
        return "assault"

    # Khaotic
    if "khaotic" in lowered:
        return "khaotic"

    # Juice Monster Apple
    if "juice" in lowered and "apple" in lowered:
        return "juice_monster_apple"

    # Rehab variants
    if "rehab" in lowered:
        if "lemon" in lowered:
            return "rehab_lemon_tea"
        if "green" in lowered:
            return "rehab_green_tea"

    # Ultra variants
    if "ultra gold" in lowered or ("ultra" in lowered and "gold" in lowered):
        return "ultra_gold"
    if "ultra violet" in lowered or ("ultra" in lowered and "violet" in lowered):
        return "ultra_violet"
    if "ultra peachy" in lowered or "peachy keen" in lowered:
        return "ultra_peachy_keen"
    if "ultra paradise" in lowered or "paradise" in lowered:
        return "ultra_paradise"
    # Ultra Rosa (also handles accented "Ultra Rosá")
    if "ultra rosa" in lowered or "rosa" in lowered or "rosá" in lowered:
        return "ultra_rosa"
    # Ultra White / Ultra Zero (same product, different naming)
    if "ultra white" in lowered or "ultra zero" in lowered:
        return "ultra_white"

    # Ripper
    if "ripper" in lowered:
        return "ripper"

    # Monarch
    if "monarch" in lowered:
        if "monster" in lowered or "energy" in lowered:
            return "monarch"

    # The Doctor
    if "the doctor" in lowered or "doctor" in lowered:
        return "the_doctor"

    # Pacific Punch
    if "pacific punch" in lowered:
        return "pacific_punch"

    # Ultra Fiesta
    if "ultra fiesta" in lowered or "fiesta" in lowered:
        return "ultra_fiesta"

    # Aussie Lemonade
    if "aussie lemonade" in lowered or ("aussie" in lowered and "lemonade" in lowered):
        return "aussie_lemonade"

    # Nitro Super Dry
    if "nitro super dry" in lowered or ("nitro" in lowered and "super dry" in lowered):
        return "nitro_super_dry"

    # Zero Sugar
    if "zero sugar" in lowered or "white zero" in lowered:
        return "zero_sugar"

    # Strawberry Flavour Energy → Ultra Strawberry Dreams (zero_sugar)
    if "strawberry" in lowered:
        return "zero_sugar"

    # Original (classic green Monster Energy can)
    if "original" in lowered:
        return "original"

    # No match — caller must handle
    return None


def get_or_create_store(
    supabase: Client, retailer: str, name: str, lat: float, lng: float, suburb: str
) -> str:
    supabase.table("stores").upsert(
        {
            "name": name,
            "retailer": retailer,
            "lat": lat,
            "lng": lng,
            "suburb": suburb,
            "address": "National pricing",
            "is_approved": True,
        },
        on_conflict="name,retailer",
    ).execute()
    result = (
        supabase.table("stores")
        .select("id")
        .eq("retailer", retailer)
        .eq("name", name)
        .execute()
    )
    return result.data[0]["id"]


def push_prices(
    supabase: Client, prices: List[Dict], retailer: str, store_id: str
):
    now = datetime.now(timezone.utc).isoformat()
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
        if variant is None:
            print(f"  [UNKNOWN_VARIANT] Could not classify '{p['product_name']}' — skipping")
            continue
        pack_size = BaseScraper._detect_pack_size(p["product_name"])

        if pack_size == "unknown":
            print(f"  [PACK_SIZE_UNMATCHED] Could not determine pack size for '{p['product_name']}' — skipping")
            continue

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

        # Record in price_history (append-only audit log)
        try:
            supabase.table("price_history").insert({
                "store_id": store_id,
                "product_id": product_id,
                "price": p["price"],
                "source": "scraper",
                "recorded_at": now,
            }).execute()
        except Exception as ph_err:
            print(f"  [WARN] Failed to write price_history: {ph_err}")

        supabase.table("prices").upsert(
            {
                "store_id": store_id,
                "product_id": product_id,
                "price": p["price"],
                "source": "scraper",
                "scraped_at": now,
            },
            on_conflict="store_id,product_id,source",
        ).execute()
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
    _STALE_ALERT_FIRED = False

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
    supervalu_store = get_or_create_store(
        supabase, "supervalu", "SuperValu Ireland (National)", 51.8985, -8.4756, "Cork City"
    )
    try:
        supervalu_prices = SuperValuIEScraper().scrape()
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

    cloudflare_blocked: dict[str, bool] = {}
    _log("--- Dunnes Stores Ireland ---")
    dunnes_scraper = DunnesIEScraper()
    try:
        dunnes_prices = dunnes_scraper.scrape()
        dunnes_store = get_or_create_store(
            supabase, "dunnes", "Dunnes Stores Ireland (National)", 51.8985, -8.4756, "Cork City"
        )
        push_prices(supabase, dunnes_prices, "dunnes", dunnes_store)
    except Exception as e:
        _log(f"  [WARN] Dunnes scraper failed: {e}")
        dunnes_prices = []
    cloudflare_blocked["Dunnes"] = dunnes_scraper.cloudflare_blocked

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

    # ------------------------------------------------------------------
    # Firecrawl-backed scrapers — for retailers without bespoke scrapers.
    # Only runs when FIRECRAWL_API_KEY is set in the environment.
    # ------------------------------------------------------------------
    firecrawl_results: dict[str, list | str] = {}
    fc_scraper_class = FirecrawlScraper
    if _HAS_FIRECRAWL and FIRECRAWL_RETAILERS and fc_scraper_class is not None:
        _log("--- Firecrawl-backed retailers ---")
        for retailer_key, rc in FIRECRAWL_RETAILERS.items():
            _log(f"--- {rc.retailer.title()} Ireland (Firecrawl) ---")
            try:
                scraper = fc_scraper_class(
                    retailer=rc.retailer,
                    search_url=rc.search_url,
                    use_structured_extraction=rc.use_structured_extraction,
                )
                prices = scraper.scrape()
                store_id = get_or_create_store(
                    supabase,
                    rc.retailer,
                    f"{rc.retailer.title()} Ireland (National)",
                    51.8985,
                    -8.4756,
                    "Cork City",
                )
                push_prices(supabase, prices, rc.retailer, store_id)
                firecrawl_results[rc.retailer] = prices
            except Exception as e:
                _log(f"  [WARN] {rc.retailer} Firecrawl scraper failed: {e}")
                firecrawl_results[rc.retailer] = "FAILED"
    else:
        _log("Firecrawl scrapers skipped (FIRECRAWL_API_KEY not set or firecrawl_ie not available)")

    # Build structured results for tooling
    run_results = {}
    for name, prices in [
        ("Lidl", lidl_prices),
        ("Aldi", aldi_prices),
        ("Tesco", tesco_prices),
        ("SuperValu", supervalu_prices),
        ("SuperValu Soft Drinks", supervalu_sd_prices),
        ("Dunnes", dunnes_prices),
        ("Centra", centra_prices),
    ]:
        if cloudflare_blocked.get(name):
            run_results[name] = {
                "attempted": True,
                "result_count": 0,
                "source": "bespoke",
                "error": "Cloudflare blocked",
            }
        elif prices and prices != "FAILED":
            run_results[name] = {
                "attempted": True,
                "result_count": len(prices),
                "source": "bespoke",
                "error": None,
            }
        elif prices == "FAILED":
            run_results[name] = {
                "attempted": True,
                "result_count": 0,
                "source": "none",
                "error": "scraper raised exception",
            }
        else:
            run_results[name] = {
                "attempted": True,
                "result_count": 0,
                "source": "none",
                "error": "empty result",
            }

    for name, count in firecrawl_results.items():
        label = name.title()
        if isinstance(count, list):
            run_results[label] = {
                "attempted": True,
                "result_count": len(count),
                "source": "firecrawl",
                "error": None,
            }
        else:
            run_results[label] = {
                "attempted": True,
                "result_count": 0,
                "source": "firecrawl",
                "error": "FAILED",
            }

    print(f"\n___STRUCTURED_RESULTS___")
    import json
    print(json.dumps(run_results, indent=2))
    print(f"___END_STRUCTURED_RESULTS___")

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

    # --- STALE_ALERT check ---
    total_retailers = len(results) + len(firecrawl_results)
    zero_result_retailers = []
    for name, count in results.items():
        if cloudflare_blocked.get(name):
            zero_result_retailers.append(f"{name} (Cloudflare blocked)")
        elif count == "FAILED" or (isinstance(count, int) and count == 0):
            zero_result_retailers.append(f"{name} (0 results)")
    for name, count in firecrawl_results.items():
        if isinstance(count, list) and len(count) == 0:
            zero_result_retailers.append(f"{name} (Firecrawl: 0 results)")
        elif count == "FAILED":
            zero_result_retailers.append(f"{name} (Firecrawl: FAILED)")

    if total_retailers > 0 and len(zero_result_retailers) / total_retailers >= 0.5:
        print(f"\n[STALE_ALERT] {len(zero_result_retailers)}/{total_retailers} retailers returned zero results:")
        for r in zero_result_retailers:
            print(f"  [STALE_ALERT]   - {r}")
        _STALE_ALERT_FIRED = True
    else:
        _STALE_ALERT_FIRED = False

    print(f"\n=== Scraper Results Summary ===")
    for name, count in results.items():
        if cloudflare_blocked.get(name):
            print(f"  {name}: 0 products (Cloudflare blocked)")
        elif count != "FAILED":
            print(f"  {name}: {count} prices")
        else:
            print(f"  {name}: FAILED")
    # Append Firecrawl-backed retailer results.
    if firecrawl_results:
        for name, count in firecrawl_results.items():
            if isinstance(count, list):
                label = name.title()
                print(f"  {label} (Firecrawl): {len(count)} prices")
            else:
                print(f"  {name.title()} (Firecrawl): FAILED")
    total = sum(v for v in results.values() if isinstance(v, int))
    total += sum(len(v) for v in firecrawl_results.values() if isinstance(v, list))
    print(f"  Total: {total} prices")

    if _STALE_ALERT_FIRED:
        print("\n[STALE_ALERT] Threshold exceeded — exiting with code 1")
        sys.exit(1)


if __name__ == "__main__":
    main()
