-- ============================================================================
-- Fix Notification Spoofing Vulnerability
-- Migration: 20250111_fix_notifications_insert
-- Description: The previous "notifications_service_insert" policy allowed
-- ANY authenticated user to insert notifications targeting ANY user_id
-- (WITH CHECK true). This fixes it to only allow:
--   1. Users to insert notifications for themselves
--   2. Service role (bypasses RLS) for DB triggers
-- ============================================================================

-- 1. Drop the permissive policy
DROP POLICY IF EXISTS "notifications_service_insert" ON notifications;

-- 2. Users can only insert notifications for themselves
CREATE POLICY "notifications_own_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
