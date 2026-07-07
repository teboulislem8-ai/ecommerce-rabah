-- ============================================================================
-- Product Images: Multi-image gallery support
-- Migration: 20250114_product_images
-- Description: Creates product_images table for multiple images per product,
-- migrates existing single images, adds RLS policies.
-- ============================================================================

-- 1. Create product_images table
-- ============================================================================
CREATE TABLE product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);

-- 2. Migrate existing single images into product_images
-- ============================================================================
INSERT INTO product_images (product_id, url, sort_order, created_at)
SELECT product_id, image, 0, created_at
FROM products
WHERE image IS NOT NULL;

-- 3. Enable RLS
-- ============================================================================
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- ============================================================================

-- Anyone can read product images
CREATE POLICY "product_images_public_read"
  ON product_images FOR SELECT
  USING (true);

-- Admins can manage all product images
CREATE POLICY "product_images_admin_all"
  ON product_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profile_id = auth.uid() AND role = 'admin'
    )
  );
