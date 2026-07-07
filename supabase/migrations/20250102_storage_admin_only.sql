-- Restrict image uploads/mutations to authenticated admin profiles only.
-- Run this in the Supabase SQL Editor or via `supabase migration up`.

-- 1. Ensure the bucket exists (create if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies for the bucket to start clean
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- 3. Allow public read (anyone can view images)
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 4. Allow INSERT only for authenticated users with admin role
CREATE POLICY "Admin Upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.profile_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 5. Allow UPDATE only for authenticated users with admin role
CREATE POLICY "Admin Update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.profile_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 6. Allow DELETE only for authenticated users with admin role
CREATE POLICY "Admin Delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.profile_id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
