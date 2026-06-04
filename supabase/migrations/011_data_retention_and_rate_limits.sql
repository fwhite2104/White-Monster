-- Migration 011: Data retention (H-01) and rate-limit cleanup (C-03)
-- Security fixes for IP anonymization and rate-limit table maintenance.

-- ──────────────────────────────────────────────
-- 1. Add updated_at trigger to user_prices (H-01)
-- ──────────────────────────────────────────────
ALTER TABLE user_prices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE OR REPLACE FUNCTION update_user_prices_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_prices_updated_at ON user_prices;
CREATE TRIGGER trg_user_prices_updated_at
  BEFORE UPDATE ON user_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_user_prices_updated_at();

-- ──────────────────────────────────────────────
-- 2. IP anonymization function (H-01)
-- Nullifies uploaded_by_ip for records older than 30 days.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION anonymize_old_user_prices_ip()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  UPDATE user_prices
  SET uploaded_by_ip = NULL
  WHERE uploaded_by_ip IS NOT NULL
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- ──────────────────────────────────────────────
-- 3. Rate-limit cleanup function (C-03)
-- Deletes expired rate-limit rows to prevent table bloat.
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_end < NOW() - INTERVAL '1 hour';
END;
$$;

-- ──────────────────────────────────────────────
-- 4. Schedule via pg_cron (if extension is available)
-- Runs daily at 03:00 UTC for IP anonymization.
-- Runs every 15 minutes for rate-limit cleanup.
-- If pg_cron is not installed, these DO blocks are no-ops
-- and the functions can be called manually or via external cron.
-- ──────────────────────────────────────────────
DO $$
BEGIN
  -- Only schedule if pg_cron extension exists
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Daily IP anonymization at 03:00 UTC
    IF NOT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'anonymize-old-user-ips'
    ) THEN
      PERFORM cron.schedule(
        'anonymize-old-user-ips',
        '0 3 * * *',
        'SELECT anonymize_old_user_prices_ip()'
      );
    END IF;

    -- Rate-limit cleanup every 15 minutes
    IF NOT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'cleanup-expired-rate-limits'
    ) THEN
      PERFORM cron.schedule(
        'cleanup-expired-rate-limits',
        '*/15 * * * *',
        'SELECT cleanup_expired_rate_limits()'
      );
    END IF;
  ELSE
    RAISE NOTICE 'pg_cron not available — IP anonymization and rate-limit cleanup must be scheduled externally';
  END IF;
END;
$$;

-- ──────────────────────────────────────────────
-- 5. Grant EXECUTE to authenticated role
-- so the API can call cleanup if needed
-- ──────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION anonymize_old_user_prices_ip() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_rate_limits() TO authenticated;
