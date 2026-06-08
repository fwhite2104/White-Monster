CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('multi_buy', 'clubcard', 'loyalty', 'clearance', 'bundle')),
  original_price DECIMAL(6, 2),
  deal_price DECIMAL(6, 2),
  savings_amount DECIMAL(6, 2) GENERATED ALWAYS AS (original_price - deal_price) STORED,
  savings_percent INTEGER GENERATED ALWAYS AS (
    CASE WHEN original_price > 0
    THEN ROUND((1 - deal_price / original_price) * 100)
    ELSE 0 END
  ) STORED,
  min_quantity INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE deal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1
);

CREATE INDEX idx_deals_retailer ON deals(retailer);
CREATE INDEX idx_deals_valid ON deals(valid_from, valid_until);
CREATE INDEX idx_deals_active ON deals(is_active) WHERE is_active = true;
CREATE INDEX idx_deal_products_deal ON deal_products(deal_id);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read deals" ON deals FOR SELECT USING (true);
CREATE POLICY "Anyone can read deal products" ON deal_products FOR SELECT USING (true);
