#!/usr/bin/env python3
"""
ONE-TIME CLEANUP SCRIPT — Run once after fixing product matching in push_prices().

This deletes ALL scraper-sourced prices from the database because they were
mis-mapped to product ID #1 (White Monster Zero Sugar) due to a bug in
the old ilike-first-word matching logic. After this cleanup, re-run
run_scrapers.py to re-populate with correctly matched prices.

Usage:
  SUPABASE_URL=<url> SUPABASE_SERVICE_KEY=<key> python3 cleanup_prices.py

SAFETY: This script only deletes rows where source='scraper'.
User-uploaded prices (source='user_upload') are NOT affected.

You can DELETE this file after running it once.
"""
import os

from supabase import create_client, Client

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]


def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # 1. Count how many scraper-sourced rows exist
    count_result = (
        supabase.table("prices")
        .select("id", count="exact")
        .eq("source", "scraper")
        .execute()
    )
    total = count_result.count
    print(f"Found {total} scraper-sourced price row(s) to delete.")

    if total == 0:
        print("Nothing to clean up — exiting.")
        return

    # 2. List a sample so the operator can verify what will be deleted
    sample = (
        supabase.table("prices")
        .select("id, store_id, product_id, price, scraped_at")
        .eq("source", "scraper")
        .limit(10)
        .execute()
    )
    if sample.data:
        print("\nSample rows that will be deleted (up to 10):")
        for row in sample.data:
            print(
                f"  id={row['id']}  store_id={row['store_id']}  "
                f"product_id={row['product_id']}  "
                f"price={row['price']}  scraped_at={row['scraped_at']}"
            )

    # 3. Delete all scraper rows
    print(f"\nDeleting {total} scraper-sourced price row(s)...")
    result = (
        supabase.table("prices")
        .delete()
        .eq("source", "scraper")
        .execute()
    )
    deleted = len(result.data)
    print(f"Deleted {deleted} row(s).")

    # 4. Quick sanity check — user_upload rows should be untouched
    upload_count = (
        supabase.table("prices")
        .select("id", count="exact")
        .eq("source", "user_upload")
        .execute()
    )
    print(f"User-uploaded price rows remaining: {upload_count.count}")


if __name__ == "__main__":
    main()
