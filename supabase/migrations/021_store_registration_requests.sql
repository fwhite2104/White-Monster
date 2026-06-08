-- 021: Store registration requests (for convenience store submissions)
-- Allows users to submit new stores for review

CREATE TABLE IF NOT EXISTS public.store_registration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  retailer text NOT NULL,
  address text NOT NULL,
  suburb text,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  store_type text NOT NULL DEFAULT 'convenience',
  reporter_ip inet NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Index for status queries (admin review)
CREATE INDEX IF NOT EXISTS idx_store_requests_status ON public.store_registration_requests(status);

-- RLS policies
ALTER TABLE public.store_registration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read registration requests"
  ON public.store_registration_requests FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert registration requests"
  ON public.store_registration_requests FOR INSERT
  WITH CHECK (true);