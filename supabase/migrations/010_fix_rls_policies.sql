-- Fix RLS policy vulnerabilities
-- Issue 1: user_prices INSERT was wide open (WITH CHECK (true))
-- Issue 2: stores INSERT was wide open (WITH CHECK (true))
-- These are defense-in-depth fixes; app-level validation handles the rest.

-- ──────────────────────────────────────────────
-- user_prices: tighten INSERT policy
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can insert user_prices" ON user_prices;

CREATE POLICY "Allow app to insert user_prices" ON user_prices FOR INSERT
  WITH CHECK (
    price > 0
    AND price < 100
    AND store_id IN (SELECT id FROM stores WHERE is_active = true)
    AND product_id IN (SELECT id FROM products WHERE is_active = true)
  );

-- ──────────────────────────────────────────────
-- stores: tighten INSERT policy
-- ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can insert stores" ON stores;

CREATE POLICY "Allow app to insert stores" ON stores FOR INSERT
  WITH CHECK (
    name IS NOT NULL
    AND name != ''
    AND retailer IS NOT NULL
    AND retailer != ''
    AND lat IS NOT NULL
    AND lng IS NOT NULL
  );
