# Storage Setup for Profile Images

To enable profile picture and cover image uploads, you need to set up Supabase Storage:

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `avatars`
5. Set it to **Public** (so images can be accessed via URL)
6. Click **Create bucket**

## Step 2: Set Up Storage Policies

Run the following SQL in your Supabase SQL Editor:

```sql
-- Policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to avatars
CREATE POLICY "Public can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## Step 3: Run Migration

Make sure you've run the migration to add the `cover_image_url` column:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
```

## Verification

After setup, users should be able to:
- Upload profile pictures (max 5MB)
- Upload cover images (max 10MB)
- Images are stored in: `avatars/{userId}/avatar-{timestamp}.{ext}` or `avatars/{userId}/cover-{timestamp}.{ext}`

