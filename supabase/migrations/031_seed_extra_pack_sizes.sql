-- Seed extra pack sizes (6_pack, 8_pack, 10_pack, 12_pack, 24_pack)
-- for all 17 Monster variants. Existing single and 4_pack rows are untouched.

INSERT INTO products (name, variant, size_ml, pack_size) VALUES
  -- zero_sugar (250ml)
  ('Monster Zero Sugar 6-Pack', 'zero_sugar', 250, '6_pack'),
  ('Monster Zero Sugar 8-Pack', 'zero_sugar', 250, '8_pack'),
  ('Monster Zero Sugar 10-Pack', 'zero_sugar', 250, '10_pack'),
  ('Monster Zero Sugar 12-Pack', 'zero_sugar', 250, '12_pack'),
  ('Monster Zero Sugar 24-Pack', 'zero_sugar', 250, '24_pack'),

  -- ultra_white (250ml)
  ('Monster Ultra White 6-Pack', 'ultra_white', 250, '6_pack'),
  ('Monster Ultra White 8-Pack', 'ultra_white', 250, '8_pack'),
  ('Monster Ultra White 10-Pack', 'ultra_white', 250, '10_pack'),
  ('Monster Ultra White 12-Pack', 'ultra_white', 250, '12_pack'),
  ('Monster Ultra White 24-Pack', 'ultra_white', 250, '24_pack'),

  -- ultra_rosa (250ml)
  ('Monster Ultra Rosa 6-Pack', 'ultra_rosa', 250, '6_pack'),
  ('Monster Ultra Rosa 8-Pack', 'ultra_rosa', 250, '8_pack'),
  ('Monster Ultra Rosa 10-Pack', 'ultra_rosa', 250, '10_pack'),
  ('Monster Ultra Rosa 12-Pack', 'ultra_rosa', 250, '12_pack'),
  ('Monster Ultra Rosa 24-Pack', 'ultra_rosa', 250, '24_pack'),

  -- ultra_paradise (250ml)
  ('Monster Ultra Paradise 6-Pack', 'ultra_paradise', 250, '6_pack'),
  ('Monster Ultra Paradise 8-Pack', 'ultra_paradise', 250, '8_pack'),
  ('Monster Ultra Paradise 10-Pack', 'ultra_paradise', 250, '10_pack'),
  ('Monster Ultra Paradise 12-Pack', 'ultra_paradise', 250, '12_pack'),
  ('Monster Ultra Paradise 24-Pack', 'ultra_paradise', 250, '24_pack'),

  -- ultra_gold (250ml)
  ('Monster Ultra Gold 6-Pack', 'ultra_gold', 250, '6_pack'),
  ('Monster Ultra Gold 8-Pack', 'ultra_gold', 250, '8_pack'),
  ('Monster Ultra Gold 10-Pack', 'ultra_gold', 250, '10_pack'),
  ('Monster Ultra Gold 12-Pack', 'ultra_gold', 250, '12_pack'),
  ('Monster Ultra Gold 24-Pack', 'ultra_gold', 250, '24_pack'),

  -- ultra_violet (250ml)
  ('Monster Ultra Violet 6-Pack', 'ultra_violet', 250, '6_pack'),
  ('Monster Ultra Violet 8-Pack', 'ultra_violet', 250, '8_pack'),
  ('Monster Ultra Violet 10-Pack', 'ultra_violet', 250, '10_pack'),
  ('Monster Ultra Violet 12-Pack', 'ultra_violet', 250, '12_pack'),
  ('Monster Ultra Violet 24-Pack', 'ultra_violet', 250, '24_pack'),

  -- ultra_peachy_keen (250ml)
  ('Monster Ultra Peachy Keen 6-Pack', 'ultra_peachy_keen', 250, '6_pack'),
  ('Monster Ultra Peachy Keen 8-Pack', 'ultra_peachy_keen', 250, '8_pack'),
  ('Monster Ultra Peachy Keen 10-Pack', 'ultra_peachy_keen', 250, '10_pack'),
  ('Monster Ultra Peachy Keen 12-Pack', 'ultra_peachy_keen', 250, '12_pack'),
  ('Monster Ultra Peachy Keen 24-Pack', 'ultra_peachy_keen', 250, '24_pack'),

  -- lando_norris (250ml)
  ('Monster Lando Norris Zero Sugar 6-Pack', 'lando_norris', 250, '6_pack'),
  ('Monster Lando Norris Zero Sugar 8-Pack', 'lando_norris', 250, '8_pack'),
  ('Monster Lando Norris Zero Sugar 10-Pack', 'lando_norris', 250, '10_pack'),
  ('Monster Lando Norris Zero Sugar 12-Pack', 'lando_norris', 250, '12_pack'),
  ('Monster Lando Norris Zero Sugar 24-Pack', 'lando_norris', 250, '24_pack'),

  -- viking_berry (250ml)
  ('Monster Viking Berry 6-Pack', 'viking_berry', 250, '6_pack'),
  ('Monster Viking Berry 8-Pack', 'viking_berry', 250, '8_pack'),
  ('Monster Viking Berry 10-Pack', 'viking_berry', 250, '10_pack'),
  ('Monster Viking Berry 12-Pack', 'viking_berry', 250, '12_pack'),
  ('Monster Viking Berry 24-Pack', 'viking_berry', 250, '24_pack'),

  -- mango_loco (500ml)
  ('Monster Mango Loco 6-Pack', 'mango_loco', 500, '6_pack'),
  ('Monster Mango Loco 8-Pack', 'mango_loco', 500, '8_pack'),
  ('Monster Mango Loco 10-Pack', 'mango_loco', 500, '10_pack'),
  ('Monster Mango Loco 12-Pack', 'mango_loco', 500, '12_pack'),
  ('Monster Mango Loco 24-Pack', 'mango_loco', 500, '24_pack'),

  -- pipeline_punch (500ml)
  ('Monster Pipeline Punch 6-Pack', 'pipeline_punch', 500, '6_pack'),
  ('Monster Pipeline Punch 8-Pack', 'pipeline_punch', 500, '8_pack'),
  ('Monster Pipeline Punch 10-Pack', 'pipeline_punch', 500, '10_pack'),
  ('Monster Pipeline Punch 12-Pack', 'pipeline_punch', 500, '12_pack'),
  ('Monster Pipeline Punch 24-Pack', 'pipeline_punch', 500, '24_pack'),

  -- assault (500ml)
  ('Monster Assault 6-Pack', 'assault', 500, '6_pack'),
  ('Monster Assault 8-Pack', 'assault', 500, '8_pack'),
  ('Monster Assault 10-Pack', 'assault', 500, '10_pack'),
  ('Monster Assault 12-Pack', 'assault', 500, '12_pack'),
  ('Monster Assault 24-Pack', 'assault', 500, '24_pack'),

  -- khaotic (500ml)
  ('Monster Khaotic 6-Pack', 'khaotic', 500, '6_pack'),
  ('Monster Khaotic 8-Pack', 'khaotic', 500, '8_pack'),
  ('Monster Khaotic 10-Pack', 'khaotic', 500, '10_pack'),
  ('Monster Khaotic 12-Pack', 'khaotic', 500, '12_pack'),
  ('Monster Khaotic 24-Pack', 'khaotic', 500, '24_pack'),

  -- juice_monster_apple (500ml)
  ('Monster Juice Monster Apple 6-Pack', 'juice_monster_apple', 500, '6_pack'),
  ('Monster Juice Monster Apple 8-Pack', 'juice_monster_apple', 500, '8_pack'),
  ('Monster Juice Monster Apple 10-Pack', 'juice_monster_apple', 500, '10_pack'),
  ('Monster Juice Monster Apple 12-Pack', 'juice_monster_apple', 500, '12_pack'),
  ('Monster Juice Monster Apple 24-Pack', 'juice_monster_apple', 500, '24_pack'),

  -- hydro_watermelon (550ml)
  ('Monster Hydro Watermelon 6-Pack', 'hydro_watermelon', 550, '6_pack'),
  ('Monster Hydro Watermelon 8-Pack', 'hydro_watermelon', 550, '8_pack'),
  ('Monster Hydro Watermelon 10-Pack', 'hydro_watermelon', 550, '10_pack'),
  ('Monster Hydro Watermelon 12-Pack', 'hydro_watermelon', 550, '12_pack'),
  ('Monster Hydro Watermelon 24-Pack', 'hydro_watermelon', 550, '24_pack'),

  -- rehab_lemon_tea (500ml)
  ('Monster Rehab Lemon Tea 6-Pack', 'rehab_lemon_tea', 500, '6_pack'),
  ('Monster Rehab Lemon Tea 8-Pack', 'rehab_lemon_tea', 500, '8_pack'),
  ('Monster Rehab Lemon Tea 10-Pack', 'rehab_lemon_tea', 500, '10_pack'),
  ('Monster Rehab Lemon Tea 12-Pack', 'rehab_lemon_tea', 500, '12_pack'),
  ('Monster Rehab Lemon Tea 24-Pack', 'rehab_lemon_tea', 500, '24_pack'),

  -- rehab_green_tea (500ml)
  ('Monster Rehab Green Tea 6-Pack', 'rehab_green_tea', 500, '6_pack'),
  ('Monster Rehab Green Tea 8-Pack', 'rehab_green_tea', 500, '8_pack'),
  ('Monster Rehab Green Tea 10-Pack', 'rehab_green_tea', 500, '10_pack'),
  ('Monster Rehab Green Tea 12-Pack', 'rehab_green_tea', 500, '12_pack'),
  ('Monster Rehab Green Tea 24-Pack', 'rehab_green_tea', 500, '24_pack')

ON CONFLICT (variant, pack_size) DO NOTHING;
