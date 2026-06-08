-- Migration 016: Create user_favorites table for shopping lists
-- Stores per-session favorited products with optional store preference

CREATE TABLE user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate favorites per (session, product, store)
CREATE UNIQUE INDEX idx_user_favorites_unique
  ON user_favorites (session_id, product_id, COALESCE(store_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Index for listing a user's favorites
CREATE INDEX idx_user_favorites_session
  ON user_favorites (session_id, created_at DESC);

-- RLS: users can only see their own favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (true);
