-- ============================================================
-- Jewelry Ecommerce Store — Seed Data
-- Local Algerian jewelry shop
-- ============================================================

BEGIN;

-- -----------------------------------------------------------
-- 1. Categories
-- -----------------------------------------------------------
INSERT INTO categories (id, name, description) VALUES
  (1, 'Rings', 'Elegant rings for every occasion'),
  (2, 'Necklaces', 'Stunning necklaces and chains'),
  (3, 'Earrings', 'Beautiful earrings for daily wear'),
  (4, 'Bracelets', 'Stylish bracelets and bangles')
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------
-- 2. Admin profile
-- -----------------------------------------------------------
INSERT INTO profiles (profile_id, email, username, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@jewelryshop.dz',
  'admin',
  'admin',
  now()
) ON CONFLICT (profile_id) DO NOTHING;

-- -----------------------------------------------------------
-- 3. Default user profile
-- -----------------------------------------------------------
INSERT INTO profiles (profile_id, email, username, role, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'user@test.dz',
  'testuser',
  'user',
  now()
) ON CONFLICT (profile_id) DO NOTHING;

-- -----------------------------------------------------------
-- 4. Products (12 items)
-- -----------------------------------------------------------
INSERT INTO products (product_id, title, description, price, image, stock, sku, category_id, created_at) VALUES

-- Rings (category_id = 1)
(
  'a1b2c3d4-0001-4000-8000-000000000001',
  'Silver Infinity Ring',
  'A sleek sterling silver ring with an infinity motif, perfect for everyday elegance.',
  3500,
  'https://placehold.co/400x400/EEE/31343C?text=Silver+Infinity+Ring',
  30,
  'JWL-RNG-001',
  1,
  now()
),
(
  'a1b2c3d4-0002-4000-8000-000000000002',
  'Gold Twist Band',
  'A delicate twisted 18K gold-plated band that catches the light beautifully.',
  6200,
  'https://placehold.co/400x400/EEE/31343C?text=Gold+Twist+Band',
  20,
  'JWL-RNG-002',
  1,
  now()
),
(
  'a1b2c3d4-0003-4000-8000-000000000003',
  'Rose Gold Cubic Zirconia Ring',
  'A romantic rose gold ring set with a sparkling cubic zirconia stone.',
  8900,
  'https://placehold.co/400x400/EEE/31343C?text=Rose+Gold+CZ+Ring',
  15,
  'JWL-RNG-003',
  1,
  now()
),

-- Necklaces (category_id = 2)
(
  'b2c3d4e5-0001-4000-8000-000000000001',
  'Pearl Drop Necklace',
  'A timeless freshwater pearl pendant on a sterling silver chain.',
  7200,
  'https://placehold.co/400x400/EEE/31343C?text=Pearl+Drop+Necklace',
  25,
  'JWL-NCK-001',
  2,
  now()
),
(
  'b2c3d4e5-0002-4000-8000-000000000002',
  'Gold Chain Link Necklace',
  'A chunky gold-plated chain link necklace for a bold statement look.',
  12500,
  'https://placehold.co/400x400/EEE/31343C?text=Gold+Chain+Necklace',
  10,
  'JWL-NCK-002',
  2,
  now()
),
(
  'b2c3d4e5-0003-4000-8000-000000000003',
  'Evil Eye Pendant Necklace',
  'A protective evil eye pendant in blue and white enamel on a delicate chain.',
  4800,
  'https://placehold.co/400x400/EEE/31343C?text=Evil+Eye+Pendant',
  40,
  'JWL-NCK-003',
  2,
  now()
),

-- Earrings (category_id = 3)
(
  'c3d4e5f6-0001-4000-8000-000000000001',
  'Hoops Silver Earrings',
  'Classic sterling silver hoop earrings, lightweight and comfortable for daily wear.',
  4100,
  'https://placehold.co/400x400/EEE/31343C?text=Silver+Hoop+Earrings',
  35,
  'JWL-ERN-001',
  3,
  now()
),
(
  'c3d4e5f6-0002-4000-8000-000000000002',
  'Turquoise Drop Earrings',
  'Handcrafted drop earrings featuring natural turquoise stones in a silver setting.',
  9500,
  'https://placehold.co/400x400/EEE/31343C?text=Turquoise+Drop+Earrings',
  12,
  'JWL-ERN-002',
  3,
  now()
),
(
  'c3d4e5f6-0003-4000-8000-000000000003',
  'Stud Diamond Simulant Earrings',
  'Brilliant round cubic zirconia studs set in 18K white gold plating.',
  5400,
  'https://placehold.co/400x400/EEE/31343C?text=CZ+Stud+Earrings',
  50,
  'JWL-ERN-003',
  3,
  now()
),

-- Bracelets (category_id = 4)
(
  'd4e5f6a7-0001-4000-8000-000000000001',
  'Leather Wrap Bracelet',
  'A braided leather wrap bracelet with a magnetic gold-tone clasp.',
  2800,
  'https://placehold.co/400x400/EEE/31343C?text=Leather+Wrap+Bracelet',
  45,
  'JWL-BRC-001',
  4,
  now()
),
(
  'd4e5f6a7-0002-4000-8000-000000000002',
  'Tennis Bracelet Cubic Zirconia',
  'A dazzling tennis bracelet with pave-set cubic zirconia stones in silver.',
  14800,
  'https://placehold.co/400x400/EEE/31343C?text=CZ+Tennis+Bracelet',
  5,
  'JWL-BRC-002',
  4,
  now()
),
(
  'd4e5f6a7-0003-4000-8000-000000000003',
  'Beaded Charm Bracelet',
  'A colorful beaded bracelet with assorted silver charms, adjustable fit.',
  2200,
  'https://placehold.co/400x400/EEE/31343C?text=Beaded+Charm+Bracelet',
  50,
  'JWL-BRC-003',
  4,
  now()
);

COMMIT;
