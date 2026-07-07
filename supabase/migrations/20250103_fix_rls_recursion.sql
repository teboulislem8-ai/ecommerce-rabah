-- Fix infinite RLS recursion on profiles table
-- All admin-check policies were using inline subqueries referencing profiles,
-- causing 42P17 "infinite recursion detected" errors.
-- Solution: SECURITY DEFINER function bypasses RLS + policies reference it.

-- 1. SECURITY DEFINER function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profile_id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Drop affected policies
DROP POLICY IF EXISTS "profiles_admin_read_all" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_update" ON profiles;
DROP POLICY IF EXISTS "products_admin_insert" ON products;
DROP POLICY IF EXISTS "products_admin_update" ON products;
DROP POLICY IF EXISTS "products_admin_delete" ON products;
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;
DROP POLICY IF EXISTS "addresses_admin_all" ON addresses;
DROP POLICY IF EXISTS "carts_admin_read_all" ON carts;
DROP POLICY IF EXISTS "cart_items_admin_all" ON cart_items;
DROP POLICY IF EXISTS "orders_admin_all" ON orders;
DROP POLICY IF EXISTS "order_items_admin_all" ON order_items;
DROP POLICY IF EXISTS "reviews_admin_all" ON reviews;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- 3. Recreate using is_admin()
CREATE POLICY "profiles_admin_read_all" ON profiles FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "profiles_admin_update" ON profiles FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_insert" ON products FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_update" ON products FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "products_admin_delete" ON products FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "categories_admin_insert" ON categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_update" ON categories FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "categories_admin_delete" ON categories FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE POLICY "addresses_admin_all" ON addresses FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "carts_admin_read_all" ON carts FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "cart_items_admin_all" ON cart_items FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "orders_admin_all" ON orders FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "order_items_admin_all" ON order_items FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "reviews_admin_all" ON reviews FOR ALL TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());
