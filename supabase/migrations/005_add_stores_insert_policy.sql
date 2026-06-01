-- Add INSERT policy on stores table for user-uploaded store locations
-- Matches existing pattern: "Anyone can insert prices" policy

CREATE POLICY "Anyone can insert stores" ON stores FOR INSERT WITH CHECK (true);
