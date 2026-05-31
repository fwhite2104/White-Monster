-- Enable PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Retailers / physical store locations
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  retailer TEXT NOT NULL,
  address TEXT,
  suburb TEXT,
  lat DECIMAL(9, 6) NOT NULL,
  lng DECIMAL(9, 6) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_stores_retailer ON stores(retailer);
CREATE INDEX idx_stores_location ON stores USING GIST (
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)
);

-- Product definitions (White Monster variants)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  variant TEXT NOT NULL,
  size_ml INTEGER DEFAULT 250,
  barcode TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_variant ON products(variant);

-- Price records (core data)
CREATE TABLE prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(6, 2) NOT NULL CHECK (price > 0 AND price < 100),
  source TEXT NOT NULL DEFAULT 'scraper',
  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  uploaded_by_ip INET,
  notes TEXT
);

CREATE INDEX idx_prices_store ON prices(store_id);
CREATE INDEX idx_prices_product ON prices(product_id);
CREATE INDEX idx_prices_scraped_at ON prices(scraped_at DESC);
CREATE INDEX idx_prices_source ON prices(source);

-- Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Anyone can read products" ON products FOR SELECT USING (true);
CREATE POLICY "Anyone can read prices" ON prices FOR SELECT USING (true);
CREATE POLICY "Anyone can insert prices" ON prices FOR INSERT WITH CHECK (true);
