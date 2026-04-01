
-- Create public storage bucket for all nexus media
INSERT INTO storage.buckets (id, name, public) VALUES ('nexus-media', 'nexus-media', true);

-- Anyone can view files in nexus-media
CREATE POLICY "Public read access for nexus-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'nexus-media');

-- Authenticated users can upload files
CREATE POLICY "Authenticated users can upload to nexus-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'nexus-media');

-- Authenticated users can update their own files
CREATE POLICY "Authenticated users can update nexus-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'nexus-media');

-- Authenticated users can delete their own files
CREATE POLICY "Authenticated users can delete from nexus-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'nexus-media');
