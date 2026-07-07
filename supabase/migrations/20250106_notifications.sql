-- ============================================================================
-- Notifications System
-- Migration: 20250106_notifications
-- Description: In-app notification center with auto-creation triggers
-- ============================================================================

-- 1. Notifications table
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL, -- 'new_order', 'low_stock', 'new_user'
  title       TEXT NOT NULL,
  body        TEXT,
  link        TEXT,          -- optional deep-link for click action
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON notifications(user_id, is_read, created_at DESC);

-- 2. Notification preferences (per-user per-category toggles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL, -- 'new_order', 'low_stock', 'new_user'
  in_app      BOOLEAN NOT NULL DEFAULT true,
  push        BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (user_id, category)
);

-- Seed default preferences for existing users with matching auth.users
INSERT INTO notification_preferences (user_id, category, in_app, push)
SELECT p.profile_id, 'new_order', true, false FROM profiles p
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.profile_id)
ON CONFLICT (user_id, category) DO NOTHING;

INSERT INTO notification_preferences (user_id, category, in_app, push)
SELECT p.profile_id, 'low_stock', true, false FROM profiles p
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.profile_id)
ON CONFLICT (user_id, category) DO NOTHING;

INSERT INTO notification_preferences (user_id, category, in_app, push)
SELECT p.profile_id, 'new_user', true, false FROM profiles p
WHERE EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.profile_id)
ON CONFLICT (user_id, category) DO NOTHING;

-- 3. Auto-create triggers
-- ============================================================================

-- 3a. New order → notify all admins
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, link)
  SELECT p.profile_id, 'new_order', 'طلب جديد', 'تم استلام طلب جديد', '/admin'
  FROM profiles p
  WHERE p.role = 'admin';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_new_order
  AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- 3b. Product updated to stock < 10 → notify admins
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
    WHERE p.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_low_stock
  AFTER UPDATE OF stock ON products
  FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

-- Also notify for newly created products with stock < 10
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
    WHERE p.role = 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_low_stock_on_insert
  AFTER INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION notify_low_stock_on_insert();

-- 3c. New admin user registered → notify other admins
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
    WHERE p.role = 'admin' AND p.profile_id != NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_notify_new_user
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_new_user();

-- 4. RLS Policies
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Notifications: users can read their own
CREATE POLICY "notifications_own_read"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Notifications: admins can read all (admin panel)
CREATE POLICY "notifications_admin_read"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );

-- Notifications: users can update is_read on their own
CREATE POLICY "notifications_own_update"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND is_read = true);

-- Notifications: service-role insert (from triggers)
CREATE POLICY "notifications_service_insert"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Preferences: users can manage their own
CREATE POLICY "preferences_own_all"
  ON notification_preferences FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 5. Enable Realtime for notifications table
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
