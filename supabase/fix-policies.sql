-- ============================================================
-- StockFlow — Fix Duplicate Policies
-- Run this if you get "policy already exists" error
-- ============================================================

-- Drop existing READ policies
DROP POLICY IF EXISTS "Allow read for all" ON categories;
DROP POLICY IF EXISTS "Allow read for all" ON products;
DROP POLICY IF EXISTS "Allow read for all" ON suppliers;
DROP POLICY IF EXISTS "Allow read for all" ON warehouses;
DROP POLICY IF EXISTS "Allow read for all" ON inventory;
DROP POLICY IF EXISTS "Allow read for all" ON stock_in;
DROP POLICY IF EXISTS "Allow read for all" ON stock_in_items;
DROP POLICY IF EXISTS "Allow read for all" ON stock_out;
DROP POLICY IF EXISTS "Allow read for all" ON stock_out_items;
DROP POLICY IF EXISTS "Allow read for all" ON stock_transfer;
DROP POLICY IF EXISTS "Allow read for all" ON stock_transfer_items;
DROP POLICY IF EXISTS "Allow read for all" ON stock_adjustments;
DROP POLICY IF EXISTS "Allow read for all" ON stock_movements;

-- Drop existing WRITE policies
DROP POLICY IF EXISTS "Allow write for authenticated" ON categories;
DROP POLICY IF EXISTS "Allow write for authenticated" ON products;
DROP POLICY IF EXISTS "Allow write for authenticated" ON suppliers;
DROP POLICY IF EXISTS "Allow write for authenticated" ON warehouses;
DROP POLICY IF EXISTS "Allow write for authenticated" ON inventory;
DROP POLICY IF EXISTS "Allow write for authenticated" ON stock_in;
DROP POLICY IF EXISTS "Allow write for authenticated" ON stock_in_items;
DROP POLICY IF EXISTS "Allow write for authenticated" ON stock_out;
DROP POLICY IF EXISTS "Allow write for authenticated" ON stock_out_items;
DROP POLICY IF EXISTS "Allow write for authenticated" ON stock_transfer;
DROP POLICY IF EXISTS "Allow write for authenticated" ON stock_transfer_items;
DROP POLICY IF EXISTS "Allow write for authenticated" ON stock_adjustments;
DROP POLICY IF EXISTS "Allow write for authenticated" ON stock_movements;

-- ============================================================
-- Add missing notes column (safe to run multiple times)
-- ============================================================
ALTER TABLE stock_in       ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE stock_out      ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE stock_transfer ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================================
-- Enable RLS (safe to run again)
-- ============================================================
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE products          ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in          ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_in_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out         ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_out_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Recreate READ policies (ทุกคนดูได้)
-- ============================================================
CREATE POLICY "Allow read for all" ON categories        FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON products          FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON suppliers         FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON warehouses        FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON inventory         FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_in          FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_in_items    FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_out         FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_out_items   FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_transfer    FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_transfer_items FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_adjustments FOR SELECT USING (true);
CREATE POLICY "Allow read for all" ON stock_movements   FOR SELECT USING (true);

-- ============================================================
-- Recreate WRITE policies (anon key เขียนได้ — ใช้ service_role จาก Next.js)
-- ============================================================
CREATE POLICY "Allow write for anon" ON categories        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON products          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON suppliers         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON warehouses        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON inventory         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON stock_in          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON stock_in_items    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON stock_out         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON stock_out_items   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON stock_transfer    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON stock_transfer_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON stock_adjustments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow write for anon" ON stock_movements   FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Seed Data (safe — ใช้ ON CONFLICT DO NOTHING)
-- ============================================================
INSERT INTO categories (name, description) VALUES
  ('Electronics',  'Electronic devices and components'),
  ('Machinery',    'Industrial machinery and equipment'),
  ('Parts',        'Spare parts and components'),
  ('Supplies',     'Office and general supplies'),
  ('Accessories',  'Product accessories')
ON CONFLICT DO NOTHING;

INSERT INTO warehouses (name, location, manager) VALUES
  ('Main Warehouse', 'Bangkok, Thailand',   'John Smith'),
  ('North Branch',   'Chiang Mai, Thailand','Jane Doe'),
  ('South Branch',   'Phuket, Thailand',    'Bob Johnson')
ON CONFLICT DO NOTHING;
