-- Add CHECK constraints on stores.lat and stores.lng to ensure valid coordinate ranges
-- Prevents storing coordinates that would cause Leaflet Invalid LatLng errors

ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS stores_lat_check,
  ADD CONSTRAINT stores_lat_check
    CHECK (lat >= -90 AND lat <= 90);

ALTER TABLE stores
  DROP CONSTRAINT IF EXISTS stores_lng_check,
  ADD CONSTRAINT stores_lng_check
    CHECK (lng >= -180 AND lng <= 180);
