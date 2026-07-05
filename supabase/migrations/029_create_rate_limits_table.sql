-- 029: Create the missing rate_limits table.
-- This table was implicitly required by migration 011 (cleanup_expired_rate_limits)
-- and is the foundation for migrations 023 (unique index) and 024 (upsert function).
-- It was never created in any previous migration.
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  window_end TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS but allow all access via service-role (rate limiting is app-enforced)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
