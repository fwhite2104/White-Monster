-- Add pack_size column to products and seed 4-pack product variants
-- All existing products default to 'single' (one can)

ALTER TABLE products
  ADD COLUMN pack_size TEXT NOT NULL DEFAULT 'single',
  ADD CONSTRAINT products_pack_size_check CHECK (pack_size IN ('single', '4_pack', 'unknown'));

INSERT INTO products (name, variant, size_ml, barcode, image_url, pack_size) VALUES
  ('White Monster Zero Sugar 4-Pack', 'zero_sugar', 250, '5060536310047', NULL, '4_pack'),
  ('Monster Ultra White 4-Pack', 'ultra_white', 250, '5060536310146', NULL, '4_pack'),
  ('Monster Ultra Rosa 4-Pack', 'ultra_rosa', 250, '5060536310122', NULL, '4_pack'),
  ('Monster Ultra Paradise 4-Pack', 'ultra_paradise', 250, '5060536310139', NULL, '4_pack');
