-- 024: Atomic rate limit upsert function.
-- Replaces the racy SELECT count then INSERT pattern with a single atomic UPSERT.
-- The unique index on (ip_address, endpoint, window_start) was added in migration 023.
CREATE OR REPLACE FUNCTION upsert_rate_limit(
  p_ip TEXT,
  p_endpoint TEXT,
  p_window_ms BIGINT,
  p_limit INT
) RETURNS TABLE(request_count INT, reset_time TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ := date_trunc('minute', now()); -- bucket by minute
  v_window_end   TIMESTAMPTZ := now() + (p_window_ms || ' milliseconds')::interval;
  v_count        INT;
BEGIN
  INSERT INTO rate_limits(ip_address, endpoint, request_count, window_start, window_end)
  VALUES (p_ip, p_endpoint, 1, v_window_start, v_window_end)
  ON CONFLICT (ip_address, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING rate_limits.request_count, rate_limits.window_end
  INTO v_count, v_window_end;

  RETURN QUERY SELECT v_count, v_window_end;
END;
$$;

-- Allow anonymous and authenticated callers (same as nearby_prices pattern)
GRANT EXECUTE ON FUNCTION upsert_rate_limit(TEXT, TEXT, BIGINT, INT) TO anon, authenticated;
