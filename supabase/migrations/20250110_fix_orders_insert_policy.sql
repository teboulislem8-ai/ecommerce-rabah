-- ============================================================================
-- Fix Missing INSERT Policies on orders and order_items
-- Migration: 20250110_fix_orders_insert_policy
-- Description: Previously, only admin users could insert orders/order_items
-- via the "orders_admin_all" FOR ALL policy. Regular users had no INSERT
-- policy, causing all COD order creations to silently fail.
-- ============================================================================

-- 1. INSERT policy for orders: users can create their own COD orders
CREATE POLICY "orders_own_insert"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND status = 'pending'
    AND payment_method = 'cod'
  );

-- 2. Read own orders (already exists, ensure no conflict)
-- "orders_own_read" policy already covers SELECT

-- 3. INSERT policy for order_items: users can add items to their own orders
CREATE POLICY "order_items_own_insert"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- 4. Users can read their own order items (already exists)
-- "order_items_own_read" policy already covers SELECT

-- 5. Users can DELETE their own order_items while order is still pending
-- (allows order modification before processing)
CREATE POLICY "order_items_own_delete"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
        AND orders.status = 'pending'
    )
  );
