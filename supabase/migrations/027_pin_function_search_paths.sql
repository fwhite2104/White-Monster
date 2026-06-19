-- 027: Pin search_path on all custom functions to prevent schema injection.
-- nearby_prices was already pinned in migration 026.
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.update_user_prices_updated_at() SET search_path = public;
ALTER FUNCTION public.anonymize_old_user_prices_ip() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_rate_limits() SET search_path = public;
