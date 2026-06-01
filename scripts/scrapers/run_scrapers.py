#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timezone
from typing import List, Dict

from supabase import create_client, Client
from lidl_ie import LidlIEScraper
from aldi_ie import AldiIEScraper
from tesco_ie import TescoIEScraper
from supervalu_ie import SuperValuIEScraper
from dunnes_ie import DunnesIEScraper

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]


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
        product_result = (
            supabase.table("products")
            .select("id")
            .ilike("name", f"%{p['product_name'].split()[0]}%")
            .execute()
        )
        if not product_result.data:
            print(f"  Product not found: {p['product_name']}")
            continue
        product_id = product_result.data[0]["id"]

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

    print("\n--- Lidl Ireland ---")
    lidl_prices = LidlIEScraper().scrape()
    lidl_store = get_or_create_store(
        supabase, "lidl", "Lidl Ireland (National)", 51.8985, -8.4756, "Cork City"
    )
    push_prices(supabase, lidl_prices, "lidl", lidl_store)

    print("\n--- Aldi Ireland ---")
    aldi_prices = AldiIEScraper().scrape()
    aldi_store = get_or_create_store(
        supabase, "aldi", "Aldi Ireland (National)", 51.8979, -8.4701, "Cork City"
    )
    push_prices(supabase, aldi_prices, "aldi", aldi_store)

    print("\n--- Tesco Ireland ---")
    tesco_prices = TescoIEScraper().scrape()
    tesco_store = get_or_create_store(
        supabase, "tesco", "Tesco Ireland (National)", 51.8985, -8.4756, "Cork City"
    )
    push_prices(supabase, tesco_prices, "tesco", tesco_store)

    print("\n--- SuperValu Ireland ---")
    supervalu_prices = SuperValuIEScraper().scrape()
    supervalu_store = get_or_create_store(
        supabase, "supervalu", "SuperValu Ireland (National)", 51.8985, -8.4756, "Cork City"
    )
    push_prices(supabase, supervalu_prices, "supervalu", supervalu_store)

    print("\n--- Dunnes Stores Ireland ---")
    dunnes_prices = DunnesIEScraper().scrape()
    dunnes_store = get_or_create_store(
        supabase, "dunnes", "Dunnes Stores Ireland (National)", 51.8985, -8.4756, "Cork City"
    )
    push_prices(supabase, dunnes_prices, "dunnes", dunnes_store)

    total = len(lidl_prices) + len(aldi_prices) + len(tesco_prices) + len(supervalu_prices) + len(dunnes_prices)
    print(f"\nDone. Total: {total} prices")


if __name__ == "__main__":
    main()
