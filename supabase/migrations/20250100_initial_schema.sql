-- ============================================================================
-- Ecommerce Platform: Initial Schema
-- Migration: 20250100_initial_schema
-- Description: Creates all tables, triggers, RLS policies, and storage rules.
-- ============================================================================

-- 0. Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tables
-- ============================================================================

-- 1a. profiles
CREATE TABLE profiles (
  profile_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username    TEXT,
  email       TEXT,
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. categories (self-referencing via parent_id)
CREATE TABLE categories (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  parent_id   BIGINT REFERENCES categories(id) ON DELETE SET NULL
);

-- 1c. products
CREATE TABLE products (
  product_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image       TEXT,
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku         TEXT,
  category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1d. addresses
CREATE TABLE addresses (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  street      TEXT NOT NULL,
  city        TEXT NOT NULL,
  state       TEXT,
  zip_code    TEXT NOT NULL,
  country     TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1e. carts
CREATE TABLE carts (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'abandoned', 'converted')),
  total_items INT NOT NULL DEFAULT 0,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1f. cart_items
CREATE TABLE cart_items (
  id          BIGSERIAL PRIMARY KEY,
  cart_id     BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  quantity    INT NOT NULL CHECK (quantity > 0),
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

-- 1g. orders
CREATE TABLE orders (
  id                 BIGSERIAL PRIMARY KEY,
  user_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total              NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  shipping_address_id BIGINT NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
  payment_method     TEXT,
  payment_id         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for idempotency checks on payment_id
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);

-- 1h. order_items
CREATE TABLE order_items (
  id          BIGSERIAL PRIMARY KEY,
  order_id    BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
  quantity    INT NOT NULL CHECK (quantity > 0),
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0)
);

-- 1i. reviews
CREATE TABLE reviews (
  id          BIGSERIAL PRIMARY KEY,
  product_id  UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);

-- 2. updated_at triggers
-- ============================================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. Cart aggregation triggers (auto-update totals on cart_items changes)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_cart_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_cart_id BIGINT;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_cart_id := NEW.cart_id;
  ELSIF TG_OP = 'DELETE' THEN
    v_cart_id := OLD.cart_id;
  END IF;

  UPDATE carts
  SET
    total_items = (
      SELECT COALESCE(SUM(quantity), 0)
      FROM cart_items
      WHERE cart_id = v_cart_id
    ),
    total_price = (
      SELECT COALESCE(SUM(quantity * price), 0)
      FROM cart_items
      WHERE cart_id = v_cart_id
    )
  WHERE id = v_cart_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cart_items_aiud
  AFTER INSERT OR UPDATE OR DELETE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_totals();

-- 4. admin_users view
-- ============================================================================
CREATE OR REPLACE VIEW admin_users AS
SELECT profile_id, username, email, role, created_at
FROM profiles
WHERE role = 'admin';

-- 5. Enable Row-Level Security
-- ============================================================================
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews     ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- ============================================================================

-- 6a. profiles
-- anyone can read public profile info (used by reviews, etc.)
CREATE POLICY "profiles_public_read"
  ON profiles FOR SELECT
  USING (true);

-- authenticated users can insert their own profile
CREATE POLICY "profiles_own_insert"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- authenticated users can update their own profile
CREATE POLICY "profiles_own_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- admins can read all profiles
CREATE POLICY "profiles_admin_read_all"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- admins can update any profile (role management, etc.)
CREATE POLICY "profiles_admin_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 6b. products
-- anyone can read products
CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (true);

-- admins can insert products
CREATE POLICY "products_admin_insert"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- admins can update products
CREATE POLICY "products_admin_update"
  ON products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- admins can delete products
CREATE POLICY "products_admin_delete"
  ON products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 6c. categories
-- anyone can read categories
CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

-- admins can insert categories
CREATE POLICY "categories_admin_insert"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- admins can update categories
CREATE POLICY "categories_admin_update"
  ON categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- admins can delete categories
CREATE POLICY "categories_admin_delete"
  ON categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 6d. addresses
-- authenticated users can read their own addresses
CREATE POLICY "addresses_own_read"
  ON addresses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- authenticated users can insert their own addresses
CREATE POLICY "addresses_own_insert"
  ON addresses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- authenticated users can update their own addresses
CREATE POLICY "addresses_own_update"
  ON addresses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- admins can read all addresses
CREATE POLICY "addresses_admin_all"
  ON addresses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 6e. carts
-- authenticated users can read their own carts
CREATE POLICY "carts_own_read"
  ON carts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- authenticated users can insert their own carts
CREATE POLICY "carts_own_insert"
  ON carts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- authenticated users can update their own carts
CREATE POLICY "carts_own_update"
  ON carts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- admins can read all carts
CREATE POLICY "carts_admin_read_all"
  ON carts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 6f. cart_items
-- authenticated users can read their own cart items (via cart join)
CREATE POLICY "cart_items_own_read"
  ON cart_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

-- authenticated users can insert items into their own carts
CREATE POLICY "cart_items_own_insert"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

-- authenticated users can update items in their own carts
CREATE POLICY "cart_items_own_update"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

-- authenticated users can delete items from their own carts
CREATE POLICY "cart_items_own_delete"
  ON cart_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
        AND carts.user_id = auth.uid()
    )
  );

-- admins can manage all cart items
CREATE POLICY "cart_items_admin_all"
  ON cart_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 6g. orders
-- authenticated users can read their own orders
CREATE POLICY "orders_own_read"
  ON orders FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- admins can manage all orders
CREATE POLICY "orders_admin_all"
  ON orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 6h. order_items
-- authenticated users can read their own order items (via order join)
CREATE POLICY "order_items_own_read"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- admins can manage all order items
CREATE POLICY "order_items_admin_all"
  ON order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 6i. reviews
-- anyone can read reviews
CREATE POLICY "reviews_public_read"
  ON reviews FOR SELECT
  USING (true);

-- authenticated users can insert their own reviews
CREATE POLICY "reviews_own_insert"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- authenticated users can update their own reviews
CREATE POLICY "reviews_own_update"
  ON reviews FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- authenticated users can delete their own reviews
CREATE POLICY "reviews_own_delete"
  ON reviews FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- admins can manage all reviews
CREATE POLICY "reviews_admin_all"
  ON reviews FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- 7. Storage: product-images bucket and its policies
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Admin Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.profile_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.profile_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admin Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.profile_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
