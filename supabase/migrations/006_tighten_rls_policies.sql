DROP POLICY IF EXISTS "Anyone can insert prices" ON prices;

CREATE POLICY "Anyone can insert valid prices" ON prices FOR INSERT
  WITH CHECK (
    price > 0
    AND price < 100
    AND source IN ('scraper', 'user_upload')
  );

CREATE POLICY "Only service role can update scraper prices" ON prices FOR UPDATE
  USING (source != 'scraper')
  WITH CHECK (true);

CREATE POLICY "No one can delete prices via API" ON prices FOR DELETE
  USING (false);

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT now(),
  window_end TIMESTAMPTZ DEFAULT now() + INTERVAL '1 minute',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON rate_limits(ip_address, endpoint, window_end);
