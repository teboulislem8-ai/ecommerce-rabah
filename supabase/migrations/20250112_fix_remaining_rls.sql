-- ============================================================================
-- Fix Remaining RLS Gaps: V-11, V-12, V-13, V-14
-- Migration: 20250112_fix_remaining_rls
-- Description:
--   V-11: Replace profiles_public_read (USING true) with profiles_own_read
--         to prevent PII leak of all user profiles.
--   V-12: Add orders_own_delete for users to delete their own pending orders.
--   V-13: Add carts_own_delete for users to delete their own active carts.
--   V-14: Add addresses_own_delete for users to delete their own addresses.
-- ============================================================================

-- V-11: Restrict profile reads to own profile only (non-admin)
-- ============================================================================
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;

CREATE POLICY "profiles_own_read"
  ON profiles FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- Admin override already exists: "profiles_admin_read_all" with public.is_admin()

-- V-12: Users can delete their own pending orders
-- ============================================================================
CREATE POLICY "orders_own_delete"
  ON orders FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'pending'
  );

-- V-13: Users can delete their own active carts
-- ============================================================================
CREATE POLICY "carts_own_delete"
  ON carts FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND status = 'active'
  );

-- V-14: Users can delete their own addresses
-- ============================================================================
CREATE POLICY "addresses_own_delete"
  ON addresses FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
