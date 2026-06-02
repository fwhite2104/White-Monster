-- Migration: Add unique constraints and updated_at trigger to prices table
-- Safe to re-run: uses IF NOT EXISTS / pg_constraint checks

-- ============================================
-- 1. Unique constraint on prices(store_id, product_id, source)
-- Ensures each store+product+source combo has only one price row.
-- When the scraper runs again, it should update the existing price instead of inserting a new row.
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_prices_store_product_source'
      AND conrelid = 'prices'::regclass
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_idx_prices_store_product_source
      ON prices(store_id, product_id, source);
    ALTER TABLE prices
      ADD CONSTRAINT uq_prices_store_product_source
      UNIQUE USING INDEX uq_idx_prices_store_product_source;
  END IF;
END $$;

-- ============================================
-- 2. Unique constraint on stores(name, retailer)
-- Prevents duplicate store entries with the same name and retailer.
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_stores_name_retailer'
      AND conrelid = 'stores'::regclass
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_idx_stores_name_retailer
      ON stores(name, retailer);
    ALTER TABLE stores
      ADD CONSTRAINT uq_stores_name_retailer
      UNIQUE USING INDEX uq_idx_stores_name_retailer;
  END IF;
END $$;

-- ============================================
-- 3. Unique constraint on products(variant, pack_size)
-- Prevents duplicate product entries for the same variant and pack size.
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uq_products_variant_pack_size'
      AND conrelid = 'products'::regclass
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_idx_products_variant_pack_size
      ON products(variant, pack_size);
    ALTER TABLE products
      ADD CONSTRAINT uq_products_variant_pack_size
      UNIQUE USING INDEX uq_idx_products_variant_pack_size;
  END IF;
END $$;

-- ============================================
-- 4. Add updated_at column to prices with auto-update trigger
-- Mirrors the behavior of stores.updated_at.
-- ============================================

-- Add column if missing
ALTER TABLE prices
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create or replace the shared trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to prices if not already attached
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_prices_updated_at'
      AND tgrelid = 'prices'::regclass
  ) THEN
    CREATE TRIGGER trg_prices_updated_at
      BEFORE UPDATE ON prices
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;
