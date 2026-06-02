#!/usr/bin/env python3
"""Diagnostic script to verify the Supabase database schema."""
import os
import sys

from supabase import create_client


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not url or not key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.")
        sys.exit(1)

    supabase = create_client(url, key)

    print("Checking schema...")
    try:
        result = (
            supabase.table("products")
            .select("pack_size")
            .limit(1)
            .execute()
        )
        print("  pack_size column: EXISTS")
    except Exception as e:
        print(f"  pack_size column: MISSING ({e})")
        print("\nYou need to apply migration 004_add_pack_size.sql to this database.")
        print("Open the Supabase Dashboard → SQL Editor and run:")
        with open("../supabase/migrations/004_add_pack_size.sql") as f:
            print(f.read())
        sys.exit(1)

    result = supabase.table("products").select("id", count="exact").execute()
    print(f"  Total products: {result.count}")

    result = (
        supabase.table("products")
        .select("*")
        .eq("pack_size", "4_pack")
        .execute()
    )
    print(f"  4-pack products: {len(result.data)}")

    result = supabase.table("prices").select("id", count="exact").execute()
    print(f"  Total prices: {result.count}")

    print("\nSchema looks good!")


if __name__ == "__main__":
    main()
