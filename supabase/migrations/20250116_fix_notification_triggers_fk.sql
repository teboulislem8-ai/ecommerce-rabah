-- ============================================================================
-- Fix Notification Trigger Foreign Key Violations
-- Migration: 20250116_fix_notification_triggers_fk
-- Description: Add EXISTS(auth.users) guard to all notify_* triggers so
-- that they only insert notifications for users whose profile_id actually
-- exists in auth.users. Prevents FK violation when a profile row remains
-- after the auth user has been deleted.
-- ============================================================================

-- 1. New order → notify all admins
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  SELECT p.profile_id, 'new_order', 'طلب جديد', 'تم استلام طلب جديد', '/admin'
  FROM profiles p
  WHERE p.role = 'admin'
    AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.profile_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Product stock drops below 10 → notify admins
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock < 10 AND (OLD.stock IS NULL OR OLD.stock >= 10) THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    SELECT p.profile_id, 'low_stock',
           'مخزون منخفض',
           'منتج "' || NEW.title || '" مخزونه ' || NEW.stock || ' فقط',
           '/admin/products'
    FROM profiles p
    WHERE p.role = 'admin'
      AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.profile_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. New product with stock < 10 → notify admins
CREATE OR REPLACE FUNCTION notify_low_stock_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock < 10 THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    SELECT p.profile_id, 'low_stock',
           'مخزون منخفض',
           'منتج "' || NEW.title || '" مخزونه ' || NEW.stock || ' فقط',
           '/admin/products'
    FROM profiles p
    WHERE p.role = 'admin'
      AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.profile_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. New admin registered → notify other admins
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    INSERT INTO notifications (user_id, type, title, body, link)
    SELECT p.profile_id, 'new_user',
           'مستخدم جديد',
           'حساب "' || COALESCE(NEW.username, NEW.email) || '" تم إنشاؤه',
           '/admin/users'
    FROM profiles p
    WHERE p.role = 'admin'
      AND p.profile_id != NEW.profile_id
      AND EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.profile_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
