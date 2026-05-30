-- 0003_advisor_fixes.sql
-- Resolve warnings de get_advisors:
--   - set_updated_at / generate_unique_slug: search_path mutable (CVE category)
--   - page-photos: SELECT policy desnecessária (URLs públicas já funcionam direto)
--
-- Mantém payment_orders sem policy (apenas service_role acessa — comportamento esperado).

-- Lock search_path em todas as functions SECURITY (boa prática anti-search-path-hijack).
alter function public.set_updated_at()        set search_path = '';
alter function public.generate_unique_slug()  set search_path = '';

-- generate_unique_slug usa gen_random_bytes (extensions) e tabela pages (public) — referenciar schema-qualified.
create or replace function public.generate_unique_slug()
returns text
language plpgsql
set search_path = ''
as $$
declare
  candidate text;
  exists_count int;
begin
  loop
    candidate := lower(
      regexp_replace(
        encode(extensions.gen_random_bytes(6), 'base64'),
        '[^a-zA-Z0-9]', '', 'g'
      )
    );
    candidate := substring(candidate from 1 for 8);
    if length(candidate) < 6 then
      continue;
    end if;
    select count(*) into exists_count from public.pages where slug = candidate;
    exit when exists_count = 0;
  end loop;
  return candidate;
end;
$$;

-- Remove SELECT policy do bucket público — URLs públicas funcionam via /object/public sem policy.
drop policy if exists "page_photos_public_read" on storage.objects;
