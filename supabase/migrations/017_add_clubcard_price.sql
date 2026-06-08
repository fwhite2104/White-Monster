-- Migration: Add Clubcard pricing support
-- N5: Tesco Clubcard Price Display
-- Clubcard prices are 15-25% lower than standard prices at Tesco Ireland

-- Add Clubcard price columns to prices table
ALTER TABLE prices ADD COLUMN clubcard_price DECIMAL(6, 2);
ALTER TABLE prices ADD COLUMN has_clubcard_pricing BOOLEAN DEFAULT false;

-- Index for filtering Clubcard prices
CREATE INDEX idx_prices_clubcard ON prices(has_clubcard_pricing)
  WHERE has_clubcard_pricing = true;

-- Comment for documentation
COMMENT ON COLUMN prices.clubcard_price IS 'Clubcard price at Tesco (null if not Tesco or no Clubcard pricing)';
COMMENT ON COLUMN prices.has_clubcard_pricing IS 'Whether this price entry has Clubcard pricing available';
