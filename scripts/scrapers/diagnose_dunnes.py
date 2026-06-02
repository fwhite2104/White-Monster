#!/usr/bin/env python3
"""Diagnostic script to investigate why Dunnes results aren't showing on dashboard."""
import os
import sys
from collections import Counter

from supabase import create_client


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.")
        sys.exit(1)

    supabase = create_client(url, key)

    print("=" * 60)
    print("DUNNES DIAGNOSTIC REPORT")
    print("=" * 60)

    print("\n1. STORES IN DATABASE")
    stores_result = supabase.table("stores").select("*").execute()
    stores = stores_result.data or []
    print(f"   Total stores: {len(stores)}")
    for s in stores:
        active = "ACTIVE" if s.get("is_active") else "INACTIVE"
        print(f"   - {s['name']} ({s['retailer']}) [{active}] lat={s['lat']} lng={s['lng']}")

    print("\n2. PRICES BY STORE")
    prices_result = supabase.table("prices").select("*, stores(id, name, retailer, is_active)").execute()
    prices = prices_result.data or []
    print(f"   Total prices: {len(prices)}")

    by_retailer = Counter()
    by_store = Counter()
    for p in prices:
        store = p.get("stores", {})
        retailer = store.get("retailer", "unknown") if store else "unknown"
        store_name = store.get("name", "unknown") if store else "unknown"
        by_retailer[retailer] += 1
        by_store[store_name] += 1

    print(f"   By retailer:")
    for retailer, count in by_retailer.most_common():
        print(f"      {retailer}: {count} prices")

    print(f"   By store name:")
    for store_name, count in by_store.most_common():
        print(f"      {store_name}: {count} prices")

    print("\n3. DUNNES PRICES DETAIL")
    dunnes_stores = [s for s in stores if s.get("retailer") == "dunnes"]
    if not dunnes_stores:
        print("   No Dunnes stores found!")
    else:
        for ds in dunnes_stores:
            store_prices = [p for p in prices if p.get("store_id") == ds["id"]]
            print(f"   Store: {ds['name']} (id={ds['id']})")
            print(f"   Prices: {len(store_prices)}")
            for p in store_prices[:5]:
                print(f"      {p['price']} EUR - product_id={p.get('product_id')}")

    print("\n4. PRODUCT VARIANTS")
    try:
        products_result = supabase.table("products").select("*").execute()
        products = products_result.data or []
        print(f"   Total products: {len(products)}")
        for pr in products:
            print(f"   - {pr['name']} | variant={pr['variant']} | size={pr.get('size_ml')}ml | pack_size={pr.get('pack_size', 'N/A')}")
    except Exception as e:
        print(f"   ERROR fetching products: {e}")
        print("   This likely means pack_size column is missing. Apply migration 004.")

    print("\n5. PRICE-PRODUCT MATCHING")
    try:
        prices_with_products = supabase.table("prices").select("*, products(id, variant, pack_size)").execute()
        pwp = prices_with_products.data or []
        orphan_count = sum(1 for p in pwp if not p.get("products"))
        print(f"   Total prices: {len(pwp)}")
        print(f"   Prices with NULL product join: {orphan_count}")
        if orphan_count > 0:
            print("   WARNING: Some prices have no matching product!")
    except Exception as e:
        print(f"   ERROR: {e}")

    print("\n" + "=" * 60)
    print("END OF DIAGNOSTIC")
    print("=" * 60)


if __name__ == "__main__":
    main()
