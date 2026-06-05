-- PostGIS RPC function for spatial price queries.
-- Replaces the JS-side distance filtering with a server-side ST_DWithin query.
-- Accepts user location, radius, variant/pack filters, and sort preference.
-- Returns flat rows with store/product joins and pre-computed distance + per_can_price.

CREATE OR REPLACE FUNCTION nearby_prices(
  p_user_lat DOUBLE PRECISION,
  p_user_lng DOUBLE PRECISION,
  p_radius_meters DOUBLE PRECISION DEFAULT 5000,
  p_variant_filter TEXT DEFAULT 'zero_sugar',
  p_sort_by TEXT DEFAULT 'price',
  p_pack_size_filter TEXT DEFAULT 'all'
)
RETURNS TABLE (
  id UUID,
  store_id UUID,
  product_id UUID,
  price NUMERIC,
  source TEXT,
  scraped_at TIMESTAMPTZ,
  distance_meters DOUBLE PRECISION,
  per_can_price NUMERIC,
  store_name TEXT,
  store_retailer TEXT,
  store_address TEXT,
  store_suburb TEXT,
  store_lat NUMERIC,
  store_lng NUMERIC,
  product_name TEXT,
  product_variant TEXT,
  product_size_ml INTEGER,
  product_image_url TEXT,
  product_pack_size TEXT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    p.id,
    p.store_id,
    p.product_id,
    p.price,
    p.source,
    p.scraped_at,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
    ) AS distance_meters,
    CASE
      WHEN prod.pack_size = '4_pack' THEN ROUND((p.price / 4)::NUMERIC, 2)
      ELSE p.price
    END AS per_can_price,
    s.name      AS store_name,
    s.retailer  AS store_retailer,
    s.address   AS store_address,
    s.suburb    AS store_suburb,
    s.lat       AS store_lat,
    s.lng       AS store_lng,
    prod.name       AS product_name,
    prod.variant    AS product_variant,
    prod.size_ml    AS product_size_ml,
    prod.image_url  AS product_image_url,
    prod.pack_size  AS product_pack_size
  FROM prices p
  INNER JOIN stores s    ON s.id = p.store_id
  INNER JOIN products prod ON prod.id = p.product_id
  WHERE s.is_active = true
    AND prod.is_active = true
    AND prod.variant = p_variant_filter
    AND NOT s.name LIKE '%(National)%'
    AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
          p_radius_meters
        )
    AND (
          p_pack_size_filter = 'all'
          OR prod.pack_size = p_pack_size_filter
        )
  ORDER BY
    CASE WHEN p_sort_by = 'price' THEN
      (CASE WHEN prod.pack_size = '4_pack' THEN p.price / 4 ELSE p.price END)
    END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'distance' THEN
      ST_Distance(
        ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
      )
    END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'name' THEN s.name END ASC NULLS LAST,
    p.scraped_at DESC
$$;

-- Allow anonymous and authenticated callers (Supabase anon key)
GRANT EXECUTE ON FUNCTION nearby_prices TO anon, authenticated;

COMMENT ON FUNCTION nearby_prices IS
  'PostGIS spatial price query: returns physical store prices within a radius, '
  'filtered by variant and pack_size, sorted by price/distance/name with distance tiebreaker.';
