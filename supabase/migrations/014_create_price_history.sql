CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(6, 2) NOT NULL CHECK (price > 0 AND price < 100),
  source TEXT NOT NULL DEFAULT 'scraper',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_recorded ON price_history(recorded_at DESC);
CREATE INDEX idx_price_history_store_product ON price_history(store_id, product_id, recorded_at DESC);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to price_history"
  ON price_history FOR SELECT
  USING (true);

CREATE POLICY "Allow service role insert to price_history"
  ON price_history FOR INSERT
  WITH CHECK (true);
