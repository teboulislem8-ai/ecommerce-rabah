-- ============================================================================
-- Delete Account: SECURITY DEFINER function + profiles_own_delete policy
-- Migration: 20250113_delete_account
-- Description: Allows users to fully delete their account and all associated
-- data via a SECURITY DEFINER function that bypasses RLS.
-- ============================================================================

-- 1. SECURITY DEFINER function to delete all user data
-- ============================================================================
CREATE OR REPLACE FUNCTION public.delete_user_account(p_user_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM notification_preferences WHERE user_id = p_user_id;
  DELETE FROM notifications WHERE user_id = p_user_id;
  DELETE FROM reviews WHERE user_id = p_user_id;
  DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = p_user_id);
  DELETE FROM carts WHERE user_id = p_user_id;
  DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = p_user_id);
  DELETE FROM orders WHERE user_id = p_user_id;
  DELETE FROM addresses WHERE user_id = p_user_id;
  DELETE FROM profiles WHERE profile_id = p_user_id;

  RETURN true;
END;
$$;

-- 2. RLS policy for users to delete their own profile row
-- (The SECURITY DEFINER function above does the full cleanup.
--  This policy exists as defense-in-depth.)
-- ============================================================================
DROP POLICY IF EXISTS "profiles_own_delete" ON profiles;
CREATE POLICY "profiles_own_delete"
  ON profiles FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());
