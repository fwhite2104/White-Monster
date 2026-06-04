-- User-reported prices table
-- Each submission creates a new row (no upsert) with a 7-day expiry.
-- Allows multiple users to report prices for the same store/product.
-- GET endpoint aggregates by (retailer, variant, pack_size) taking lowest most recent.

CREATE TABLE user_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(6, 2) NOT NULL CHECK (price > 0 AND price < 100),
  uploaded_by_ip INET,
  notes TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_prices_store ON user_prices(store_id);
CREATE INDEX idx_user_prices_product ON user_prices(product_id);
CREATE INDEX idx_user_prices_expires ON user_prices(expires_at) WHERE expires_at > now();

ALTER TABLE user_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read user_prices" ON user_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert user_prices" ON user_prices FOR INSERT WITH CHECK (true);
