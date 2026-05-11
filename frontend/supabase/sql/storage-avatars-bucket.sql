-- =============================================================================
-- Bucket público de avatares + lectura pública de objetos.
-- Ejecutá este archivo en: Supabase Dashboard → SQL → New query → Run
--
-- Subidas: hacelas desde el backend con SUPABASE_SERVICE_ROLE_KEY (bypass RLS).
-- No pegues la service_role en el cliente ni en variables NEXT_PUBLIC_*.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública de archivos en este bucket (URLs /object/public/avatars/...)
DROP POLICY IF EXISTS "storage_avatars_select_public" ON storage.objects;
CREATE POLICY "storage_avatars_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- No creamos política de INSERT para anon/authenticated: las subidas van por
-- servidor con service_role, que ignora estas políticas.
