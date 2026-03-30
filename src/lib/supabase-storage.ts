// Supabase Storage operations for image uploads
import { getSupabaseClient } from './supabase-client';

export type StorageBucket = 'portfolio' | 'avatars' | 'general' | 'campaign-assets' | 'hero' | 'briefs';

// Upload a file to Supabase Storage
export const uploadFile = async (
  bucket: StorageBucket,
  file: File,
  path?: string
): Promise<{ url: string | null; error: string | null }> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return { url: null, error: 'Supabase no está configurado' };
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Upload file
    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { url: null, error: error.message };
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    console.error('Upload exception:', err);
    return { url: null, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
};

// Delete a file from Supabase Storage
export const deleteFile = async (
  bucket: StorageBucket,
  filePath: string
): Promise<{ success: boolean; error: string | null }> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return { success: false, error: 'Supabase no está configurado' };
  }

  try {
    // Extract path from full URL if provided
    let path = filePath;
    if (filePath.includes('/storage/v1/object/public/')) {
      const parts = filePath.split(`/storage/v1/object/public/${bucket}/`);
      path = parts[1] || filePath;
    }

    const { error } = await client.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Error desconocido' };
  }
};

// Check if storage bucket exists and is accessible
export const checkBucketAccess = async (bucket: StorageBucket): Promise<boolean> => {
  const client = getSupabaseClient();
  
  if (!client) {
    return false;
  }

  try {
    const { error } = await client.storage.from(bucket).list('', { limit: 1 });
    return !error;
  } catch {
    return false;
  }
};

// Get SQL to create storage bucket and policies
export const getStorageSetupSQL = (): string => {
  return `-- ============================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- ============================================

-- Crear bucket para imágenes del perfil (logo, foto de perfil)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media', 
  'media', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para imágenes de campañas (logos de marcas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'campaigns', 
  'campaigns', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS DE STORAGE - BUCKET MEDIA
-- ============================================

-- Permitir lectura pública del bucket media
CREATE POLICY "Public read access for media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'media');

-- Permitir subida solo a usuarios autenticados con rol admin
CREATE POLICY "Admin upload access for media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Permitir eliminación solo a usuarios autenticados con rol admin
CREATE POLICY "Admin delete access for media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' 
  AND public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- POLÍTICAS DE STORAGE - BUCKET CAMPAIGNS
-- ============================================

-- Permitir lectura pública del bucket campaigns
CREATE POLICY "Public read access for campaigns"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaigns');

-- Permitir subida solo a usuarios autenticados con rol admin
CREATE POLICY "Admin upload access for campaigns"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'campaigns' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Permitir eliminación solo a usuarios autenticados con rol admin
CREATE POLICY "Admin delete access for campaigns"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'campaigns' 
  AND public.has_role(auth.uid(), 'admin')
);

-- ============================================
-- AÑADIR CAMPO DE LOGO A CAMPAÑAS (si no existe)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'brand_logo_url'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN brand_logo_url TEXT;
  END IF;
END $$;
`;
};
