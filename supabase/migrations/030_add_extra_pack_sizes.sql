-- Add extra pack sizes to products and price_alerts CHECK constraints
-- Previously: single, 4_pack (products); single, 4_pack (price_alerts)
-- Now allows: single, 4_pack, 6_pack, 8_pack, 10_pack, 12_pack, 24_pack, unknown (products)
-- Now allows: single, 4_pack, 6_pack, 8_pack, 10_pack, 12_pack, 24_pack (price_alerts)

ALTER TABLE products DROP CONSTRAINT products_pack_size_check;
ALTER TABLE products ADD CONSTRAINT products_pack_size_check CHECK (pack_size IN ('single', '4_pack', '6_pack', '8_pack', '10_pack', '12_pack', '24_pack', 'unknown'));

ALTER TABLE price_alerts DROP CONSTRAINT IF EXISTS price_alerts_pack_size_check;
ALTER TABLE price_alerts ADD CONSTRAINT price_alerts_pack_size_check CHECK (pack_size = ANY (ARRAY['single', '4_pack', '6_pack', '8_pack', '10_pack', '12_pack', '24_pack']));
