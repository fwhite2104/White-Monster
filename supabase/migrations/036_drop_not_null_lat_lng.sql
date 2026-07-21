-- Allow null coordinates on stores for national store anchor rows.
-- National anchors (e.g. "Lidl Ireland (National)") have no physical
-- location — they represent nationwide pricing fanned out at query time.
ALTER TABLE stores ALTER COLUMN lat DROP NOT NULL;
ALTER TABLE stores ALTER COLUMN lng DROP NOT NULL;