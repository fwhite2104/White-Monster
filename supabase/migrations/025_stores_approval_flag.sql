-- 025: Add is_approved flag to stores. Scraper-seeded stores are pre-approved.
-- User-submitted stores (via the POST /api/prices endpoint) land as unapproved.

-- 1. Add the approval column
ALTER TABLE stores ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT false;

-- 2. Approve all existing active stores (scraper-seeded and national entries)
UPDATE stores SET is_approved = true WHERE is_active = true;

-- 3. Tighten the stores INSERT policy: user submissions must land as unapproved.
--    Drop the old policy that had no approval gate.
DROP POLICY IF EXISTS "Allow app to insert stores" ON stores;

-- 4. Create the replacement policy with is_approved=false check plus existing field validations
CREATE POLICY "Allow app to insert stores"
  ON stores FOR INSERT
  WITH CHECK (
    is_approved = false
    AND name IS NOT NULL AND name != ''
    AND retailer IS NOT NULL AND retailer != ''
    AND lat IS NOT NULL AND lng IS NOT NULL
  );
