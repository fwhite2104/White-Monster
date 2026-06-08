-- 020: Convenience store price report registry
-- Allows users to report prices from convenience stores (Centra, Spar, Mace, etc.)

CREATE TABLE IF NOT EXISTS public.convenience_price_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price numeric NOT NULL CHECK (price > 0),
  reporter_ip inet NOT NULL,
  confidence text DEFAULT 'user_reported',
  photo_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_convenience_reports_store ON public.convenience_price_reports(store_id);
CREATE INDEX IF NOT EXISTS idx_convenience_reports_expiry ON public.convenience_price_reports(expires_at);

-- RLS policies
ALTER TABLE public.convenience_price_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read convenience reports"
  ON public.convenience_price_reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert convenience reports"
  ON public.convenience_price_reports FOR INSERT
  WITH CHECK (true);