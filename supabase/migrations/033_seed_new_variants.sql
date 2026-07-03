-- Seed product rows for 7 new Monster variants added in B1 (2026-07-03 audit).
-- Each variant gets 'single' and '4_pack' rows for common retail formats.
-- Additional pack sizes (6/8/10/12/24) can be added as they're confirmed
-- in Irish retailers.
--
-- Reference: scripts/scrapers/run_scrapers.py _extract_variant()
-- Reference: supabase/migrations/031_seed_extra_pack_sizes.sql (original 17 variants)

INSERT INTO products (name, variant, size_ml, pack_size) VALUES
  -- Ripper (500ml, full sugar)
  ('Monster Ripper', 'ripper', 500, 'single'),
  ('Monster Ripper 4-Pack', 'ripper', 500, '4_pack'),

  -- Monarch (500ml, full sugar)
  ('Monster Monarch', 'monarch', 500, 'single'),
  ('Monster Monarch 4-Pack', 'monarch', 500, '4_pack'),

  -- The Doctor (500ml, full sugar)
  ('Monster The Doctor', 'the_doctor', 500, 'single'),
  ('Monster The Doctor 4-Pack', 'the_doctor', 500, '4_pack'),

  -- Pacific Punch (500ml, full sugar)
  ('Monster Pacific Punch', 'pacific_punch', 500, 'single'),
  ('Monster Pacific Punch 4-Pack', 'pacific_punch', 500, '4_pack'),

  -- Ultra Fiesta (250ml, zero sugar)
  ('Monster Ultra Fiesta', 'ultra_fiesta', 250, 'single'),
  ('Monster Ultra Fiesta 4-Pack', 'ultra_fiesta', 250, '4_pack'),

  -- Aussie Lemonade (500ml, full sugar)
  ('Monster Aussie Lemonade', 'aussie_lemonade', 500, 'single'),
  ('Monster Aussie Lemonade 4-Pack', 'aussie_lemonade', 500, '4_pack'),

  -- Nitro Super Dry (500ml, Nitro line)
  ('Monster Nitro Super Dry', 'nitro_super_dry', 500, 'single'),
  ('Monster Nitro Super Dry 4-Pack', 'nitro_super_dry', 500, '4_pack')

ON CONFLICT (variant, pack_size) DO NOTHING;
