-- 0002_storage.sql
-- Buckets:
--   page-photos   -> public read, anon NÃO escreve (writes via Edge service_role).
--   page-qrcodes  -> private (apenas service_role).
--
-- Limites: 5MB por foto, MIME image/*.

-- =========================================================
-- Buckets
-- =========================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('page-photos',  'page-photos',  true,  5242880, array['image/jpeg','image/png','image/webp','image/heic']),
  ('page-qrcodes', 'page-qrcodes', false, 1048576, array['image/png'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- =========================================================
-- Policies em storage.objects
-- =========================================================
-- Limpa policies anteriores se existirem (idempotente).
drop policy if exists "page_photos_public_read"     on storage.objects;
drop policy if exists "page_qrcodes_no_anon"        on storage.objects;

-- Leitura pública das fotos.
create policy "page_photos_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'page-photos');

-- QR codes: nenhuma policy = nenhum acesso anon/authenticated.
-- Apenas service_role (Edge) lê/escreve.

-- Uploads/deletes: nenhuma policy criada para anon/authenticated em nenhum bucket.
-- Logo, mutações exigem service_role (Edge Functions).
