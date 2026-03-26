-- ============================================================
-- StockFlow Inventory Management - Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit TEXT NOT NULL DEFAULT 'pcs',
  dealer_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  retail_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  requires_sn BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. SUPPLIERS
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. WAREHOUSES
-- ============================================================
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  manager TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. INVENTORY (current stock per product per warehouse)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_id, warehouse_id)
);

-- ============================================================
-- 6. STOCK IN
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_in (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_in_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stock_in_id UUID NOT NULL REFERENCES stock_in(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  serial_numbers TEXT[]
);

-- ============================================================
-- 7. STOCK OUT
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_out (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  issued_to TEXT,
  date DATE NOT NULL,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_out_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stock_out_id UUID NOT NULL REFERENCES stock_out(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  serial_numbers TEXT[]
);

-- ============================================================
-- 8. STOCK TRANSFER
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_transfer (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (from_warehouse_id <> to_warehouse_id)
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transfer_id UUID NOT NULL REFERENCES stock_transfer(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  serial_numbers TEXT[]
);

-- ============================================================
-- 9. STOCK ADJUSTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  system_qty INTEGER NOT NULL,
  actual_qty INTEGER NOT NULL,
  difference INTEGER NOT NULL,
  reason TEXT,
  serial_numbers TEXT[],
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. STOCK MOVEMENTS LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  reference_id UUID,
  serial_numbers TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Auth-based access control
-- Only authenticated users (admins) can write data.
-- Anyone (including anon) can READ (for public dashboards).
-- Change READ policies to authenticated-only if needed.
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- READ: allow anyone (anon key) to view data
CREATE POLICY "Allow read for all" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON products FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON suppliers FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON warehouses FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON inventory FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_in FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_in_items FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_out FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_out_items FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_transfer FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_transfer_items FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_adjustments FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_movements FOR SELECT USING (true);

-- WRITE: only authenticated users can insert/update/delete
CREATE POLICY "Allow write for authenticated" ON categories FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON products FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON suppliers FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON warehouses FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON inventory FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON stock_in FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON stock_in_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON stock_out FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON stock_out_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON stock_transfer FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON stock_transfer_items FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON stock_adjustments FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated" ON stock_movements FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA (Sample) — Run only once on a fresh database
-- ============================================================
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices and components'),
  ('Machinery', 'Industrial machinery and equipment'),
  ('Parts', 'Spare parts and components'),
  ('Supplies', 'Office and general supplies'),
  ('Accessories', 'Product accessories')
ON CONFLICT DO NOTHING;

INSERT INTO warehouses (name, location, manager) VALUES
  ('Main Warehouse', 'Bangkok, Thailand', 'John Smith'),
  ('North Branch', 'Chiang Mai, Thailand', 'Jane Doe'),
  ('South Branch', 'Phuket, Thailand', 'Bob Johnson')
ON CONFLICT DO NOTHING;
