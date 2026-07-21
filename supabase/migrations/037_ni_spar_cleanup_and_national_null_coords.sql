-- Remove 2 Northern Ireland Spar stores (out of Republic scope).
DELETE FROM prices WHERE store_id IN (
  'f68fe3e1-969b-41fe-a781-dd92ba60a240',
  'd149e726-7ab0-4125-901b-05eef9a79b29'
);
DELETE FROM stores WHERE id IN (
  'f68fe3e1-969b-41fe-a781-dd92ba60a240',  -- McElroy's Spar, Augher (Co. Tyrone, NI)
  'd149e726-7ab0-4125-901b-05eef9a79b29'   -- Spar Express, Belfast, NI
);

-- Retag national anchor rows with null coords + 'Ireland (national)' suburb.
-- These fan out to physical stores at query time (expandNationalPrices).
UPDATE stores
SET lat = NULL, lng = NULL, suburb = 'Ireland (national)'
WHERE name LIKE '%(National)' AND suburb = 'Cork City';