-- 0005_email_and_qr.sql
-- Fase 7: e-mail de confirmação + QR Code.
--
-- 1. Coluna pages.email_sent_at — idempotência do envio (NULL = ainda não enviado).
-- 2. Torna o bucket page-qrcodes público. O QR apenas codifica o link público
--    /p/<slug> (que já circula livremente), então não há dado sensível. Público
--    permite que o e-mail e a página pública carreguem a imagem via URL estável
--    (getPublicUrl), sem signed URLs que expiram.

-- =========================================================
-- 1. pages.email_sent_at
-- =========================================================
alter table public.pages
  add column if not exists email_sent_at timestamptz;

comment on column public.pages.email_sent_at is
  'Timestamp do envio do e-mail de confirmação. NULL = ainda não enviado (idempotência).';

-- =========================================================
-- 2. page-qrcodes público
-- =========================================================
update storage.buckets set public = true where id = 'page-qrcodes';

drop policy if exists "page_qrcodes_public_read" on storage.objects;
create policy "page_qrcodes_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'page-qrcodes');

-- Escrita continua só via service_role (Edge Functions) — nenhuma policy de insert/update.
