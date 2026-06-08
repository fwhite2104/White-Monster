CREATE TABLE price_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  target_price NUMERIC NOT NULL CHECK (target_price > 0),
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  pack_size TEXT DEFAULT 'single' CHECK (pack_size IN ('single', '4_pack')),
  radius_km INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_price_alerts_active
  ON price_alerts (is_active, last_notified_at)
  WHERE is_active = true;

CREATE INDEX idx_price_alerts_session
  ON price_alerts (session_id);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write for price_alerts"
  ON price_alerts FOR ALL
  USING (true)
  WITH CHECK (true);
