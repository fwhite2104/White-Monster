-- 022: Fix PostGIS schema placement and repair the spatial index on stores.
-- PostGIS was installed in public (migration 001). We cannot move it retroactively
-- without superuser, but we CAN revoke public access to its system tables and fix the index.

-- 1. Revoke anon/authenticated access to the PostGIS system table exposed in public.
--    We cannot ALTER or DROP spatial_ref_sys (not owner), but we can revoke SELECT.
REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;

-- 2. Revoke execute on PostGIS SECURITY DEFINER functions accessible to anon/authenticated.
--    These are PostGIS internals that should not be callable via the REST API.
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.st_estimatedextent(text, text, text, boolean) FROM anon, authenticated;

-- 3. Fix the spatial index on stores.
--    Current index uses NUMERIC columns; ST_DWithin needs geography/geometry so the index is never hit.
--    Drop the broken index and replace with a proper geography-cast functional index.
DROP INDEX IF EXISTS idx_stores_location;
CREATE INDEX idx_stores_location ON stores USING GIST (
  ST_SetSRID(
    ST_MakePoint(lng::double precision, lat::double precision),
    4326
  )::geography
);
