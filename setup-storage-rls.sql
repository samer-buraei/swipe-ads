-- ==========================================
-- Supabase Storage Setup: listing-images
-- ==========================================

-- 1. Create the bucket (Skip if already exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public read access to all images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- 3. Allow authenticated users to upload images
-- (Using auth.role() = 'authenticated' to allow any logged-in user or demo mode)
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'listing-images' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role')
);

-- 4. Allow users to update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listing-images' AND owner = auth.uid());

-- 5. Allow users to delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listing-images' AND owner = auth.uid());
