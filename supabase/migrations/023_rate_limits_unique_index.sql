-- 023: Add unique constraint for atomic rate limit upsert.
-- Enables ON CONFLICT in the upsert_rate_limit function (migration 024).
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_upsert
  ON rate_limits(ip_address, endpoint, window_start);
