-- 026: Update nearby_prices RPC to exclude unapproved stores and pin search_path.
-- Function signature remains identical to migration 018 so no TypeScript changes are needed.
CREATE OR REPLACE FUNCTION public.nearby_prices(
  p_user_lat double precision,
  p_user_lng double precision,
  p_radius_meters double precision,
  p_variant_filter text DEFAULT 'zero_sugar',
  p_sort_by text DEFAULT 'price',
  p_pack_size_filter text DEFAULT 'all'
)
RETURNS TABLE(
  id uuid, store_id uuid, product_id uuid, price numeric, source text,
  scraped_at timestamptz, distance_meters double precision, per_can_price numeric,
  clubcard_price numeric, has_clubcard_pricing boolean,
  store_name text, store_retailer text, store_address text, store_suburb text,
  store_lat double precision, store_lng double precision,
  product_name text, product_variant text, product_size_ml integer,
  product_image_url text, product_pack_size text
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    p.id, p.store_id, p.product_id, p.price, p.source, p.scraped_at,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(s.lng::double precision, s.lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
    ) AS distance_meters,
    CASE WHEN prod.pack_size = '4_pack' THEN ROUND((p.price / 4)::NUMERIC, 2) ELSE p.price END AS per_can_price,
    p.clubcard_price,
    CASE WHEN s.retailer = 'tesco' AND p.clubcard_price IS NOT NULL THEN true ELSE false END AS has_clubcard_pricing,
    s.name, s.retailer, s.address, s.suburb,
    s.lat::double precision, s.lng::double precision,
    prod.name, prod.variant, prod.size_ml, prod.image_url, prod.pack_size
  FROM prices p
  INNER JOIN stores s ON s.id = p.store_id
  INNER JOIN products prod ON prod.id = p.product_id
  WHERE s.is_active = true
    AND s.is_approved = true
    AND prod.is_active = true
    AND prod.variant = p_variant_filter
    AND NOT s.name LIKE '%(National)%'
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(s.lng::double precision, s.lat::double precision), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
      p_radius_meters
    )
    AND (p_pack_size_filter = 'all' OR prod.pack_size = p_pack_size_filter)
  ORDER BY
    CASE WHEN p_sort_by = 'price' THEN
      (CASE WHEN prod.pack_size = '4_pack' THEN p.price / 4 ELSE p.price END)
    END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'distance' THEN
      ST_Distance(
        ST_SetSRID(ST_MakePoint(s.lng::double precision, s.lat::double precision), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
      )
    END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'name' THEN s.name END ASC NULLS LAST,
    p.scraped_at DESC
$$;

-- Re-grant execution after CREATE OR REPLACE
GRANT EXECUTE ON FUNCTION nearby_prices TO anon, authenticated;
