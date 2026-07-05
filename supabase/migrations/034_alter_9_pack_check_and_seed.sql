-- Migration: 034_alter_9_pack_check_and_seed.sql
-- Purpose: Add 9_pack to products.pack_size CHECK constraint and seed 9-pack product rows
-- Issue: Dunnes sells "Monster Energy Ultra Zero Sugar 9 x 500ml" (product id 100331019)
--         _detect_pack_size() already returns '9_pack' for "9x500ml" patterns
--         but DB CHECK only allowed 'single', '4_pack', 'unknown' — causing MATCH failures

-- Step 1: Expand CHECK constraint to include all pack sizes (matches constants.ts PACK_SIZES)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pack_size_check;
ALTER TABLE products ADD CONSTRAINT products_pack_size_check
  CHECK (pack_size = ANY (ARRAY[
    'single'::text,
    '4_pack'::text,
    '9_pack'::text,
    '6_pack'::text,
    '8_pack'::text,
    '10_pack'::text,
    '12_pack'::text,
    '24_pack'::text,
    'unknown'::text
  ]));

-- Step 2: Seed 9_pack product rows for all variants that have a 'single' row
INSERT INTO products (name, variant, pack_size, is_active, created_at)
SELECT
  variant || ' 9-Pack',
  variant,
  '9_pack',
  true,
  NOW()
FROM (
  SELECT DISTINCT variant FROM products WHERE pack_size = 'single'
) AS variants
ON CONFLICT (variant, pack_size) DO NOTHING;
