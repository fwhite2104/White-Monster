-- Migration: 035_seed_strawberry_dreams.sql
-- Purpose: Seed product rows for Monster Ultra Strawberry Dreams (500ml, zero sugar)
-- Reference: https://www.dunnesstoresgrocery.com/sm/delivery/rsid/258/product/monster-energy-ultra-strawberry-dreams-strawberry-flavour-4-x-500ml-id-100321943
-- Scraper key: run_scrapers.py _extract_variant() returns 'strawberry_dreams'

INSERT INTO products (name, variant, size_ml, pack_size) VALUES
  ('Monster Ultra Strawberry Dreams', 'strawberry_dreams', 500, 'single'),
  ('Monster Ultra Strawberry Dreams 4-Pack', 'strawberry_dreams', 500, '4_pack')
ON CONFLICT (variant, pack_size) DO NOTHING;
