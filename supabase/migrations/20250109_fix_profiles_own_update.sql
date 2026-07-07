-- ============================================================================
-- Fix Privilege Escalation in profiles_own_update
-- Migration: 20250109_fix_profiles_own_update
-- Description: Prevents authenticated users from setting role='admin' on
-- their own profile. The previous policy only checked profile_id ownership
-- in WITH CHECK but did not protect the role column.
-- ============================================================================

-- 1. Drop the vulnerable policy
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;

-- 2. Recreate with column-level protection on role
CREATE POLICY "profiles_own_update"
  ON profiles FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE profile_id = auth.uid())
  );

-- 3. Defense in depth: REVOKE UPDATE on role at column level
-- This is enforced before RLS evaluation — PostgreSQL rejects the update
-- even if the policy would permit it.
REVOKE UPDATE (role) ON profiles FROM authenticated;
