#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timezone
from typing import List, Dict

from supabase import create_client, Client
from lidl_ie import LidlIEScraper
from aldi_ie import AldiIEScraper

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

    print(f"\nDone. Total: {len(lidl_prices) + len(aldi_prices)} prices")


if __name__ == "__main__":
    main()
