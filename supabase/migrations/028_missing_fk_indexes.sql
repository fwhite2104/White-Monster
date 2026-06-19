-- 028: Add indexes for unindexed foreign keys flagged by performance advisor.
CREATE INDEX IF NOT EXISTS idx_convenience_reports_product
  ON convenience_price_reports(product_id);

CREATE INDEX IF NOT EXISTS idx_deal_products_product
  ON deal_products(product_id);

CREATE INDEX IF NOT EXISTS idx_price_alerts_store
  ON price_alerts(store_id);

CREATE INDEX IF NOT EXISTS idx_user_favorites_product
  ON user_favorites(product_id);

CREATE INDEX IF NOT EXISTS idx_user_favorites_store
  ON user_favorites(store_id);

-- Fix user_prices partial index (predicate with now() is non-immutable, prevents use)
DROP INDEX IF EXISTS idx_user_prices_expires;
CREATE INDEX idx_user_prices_expires_at ON user_prices(expires_at);

-- Add index for rate_limits cleanup query
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
