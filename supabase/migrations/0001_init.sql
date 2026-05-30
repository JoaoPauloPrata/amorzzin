-- 0001_init.sql
-- Amorzin v2 — schema inicial: plans, pages, page_photos, payment_orders.
-- RLS: leitura pública apenas para conteúdo ativo. Mutations só via service_role (Edge Functions).

-- =========================================================
-- Extensions (idempotent)
-- =========================================================
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- =========================================================
-- Helpers
-- =========================================================

-- updated_at autoupdate
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Slug generator: lowercase base36 from random bytes, 8 chars, unique check loop.
create or replace function public.generate_unique_slug()
returns text
language plpgsql
as $$
declare
  candidate text;
  exists_count int;
begin
  loop
    -- 6 random bytes -> 8 base64 chars -> strip + / =, lowercase, take 8
    candidate := lower(
      regexp_replace(
        encode(gen_random_bytes(6), 'base64'),
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

-- =========================================================
-- Table: plans
-- =========================================================
create table if not exists public.plans (
  id                  text primary key,                            -- e.g. 'forever', 'annual'
  display_name        text not null,
  price_cents         int  not null check (price_cents >= 0),
  duration_days       int  null,                                   -- NULL = vitalício
  max_photos          int  not null check (max_photos > 0),
  max_message_length  int  not null default 1000,
  active              bool not null default true,
  created_at          timestamptz not null default now()
);

comment on table public.plans is 'Catálogo de planos. Lido publicamente.';
comment on column public.plans.duration_days is 'NULL = vitalício; senão expira em N dias após pagamento.';

-- =========================================================
-- Table: pages
-- =========================================================
create table if not exists public.pages (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text unique not null default public.generate_unique_slug(),
  edit_token               uuid not null default gen_random_uuid(),
  status                   text not null default 'draft'
                            check (status in ('draft','pending_payment','active','expired','disabled')),
  plan_id                  text references public.plans(id) on delete restrict,

  title                    text,
  recipient_name           text,
  message                  text,
  relationship_start       date,

  music_embed_url          text,
  music_provider           text check (music_provider in ('youtube','spotify')),

  animation_type           text default 'hearts'
                            check (animation_type in ('hearts','heart_eyes','custom')),
  animation_custom_emoji   text,

  carousel_style           text default 'fade'
                            check (carousel_style in ('fade','slide','zoom','flip','coverflow')),

  contact_email            text,
  contact_phone            text,

  activated_at             timestamptz,
  expires_at               timestamptz,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists pages_status_idx           on public.pages(status);
create index if not exists pages_status_expires_idx   on public.pages(status, expires_at);
create index if not exists pages_contact_email_idx    on public.pages(contact_email);
create index if not exists pages_created_at_idx       on public.pages(created_at);

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

comment on table public.pages is 'Página de presente personalizada. Identificada publicamente por slug; mutações via edit_token.';
comment on column public.pages.edit_token is 'UUID secreto entregue ao criador para editar antes do pagamento. Nunca exposto em leituras públicas.';

-- =========================================================
-- Table: page_photos
-- =========================================================
create table if not exists public.page_photos (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references public.pages(id) on delete cascade,
  storage_path  text not null,                 -- caminho dentro do bucket page-photos
  position      int  not null check (position >= 0),
  created_at    timestamptz not null default now(),
  unique (page_id, position)
);

create index if not exists page_photos_page_idx on public.page_photos(page_id, position);

comment on table public.page_photos is 'Fotos do carrossel. storage_path = caminho no bucket page-photos.';

-- =========================================================
-- Table: payment_orders
-- =========================================================
create table if not exists public.payment_orders (
  id                      uuid primary key default gen_random_uuid(),
  page_id                 uuid not null references public.pages(id) on delete restrict,
  plan_id                 text not null references public.plans(id) on delete restrict,
  amount_cents            int  not null check (amount_cents >= 0),
  status                  text not null default 'pending'
                           check (status in ('pending','approved','rejected','refunded','cancelled')),
  mp_preference_id        text,
  mp_payment_id           text unique,                     -- idempotência webhook
  mp_external_reference   text,
  raw_payload             jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists payment_orders_page_idx       on public.payment_orders(page_id);
create index if not exists payment_orders_status_idx     on public.payment_orders(status);
create index if not exists payment_orders_mp_pref_idx    on public.payment_orders(mp_preference_id);

drop trigger if exists payment_orders_set_updated_at on public.payment_orders;
create trigger payment_orders_set_updated_at
before update on public.payment_orders
for each row execute function public.set_updated_at();

comment on table public.payment_orders is 'Ordens MercadoPago. mp_payment_id UNIQUE garante idempotência do webhook.';

-- =========================================================
-- RLS
-- =========================================================
alter table public.plans          enable row level security;
alter table public.pages          enable row level security;
alter table public.page_photos    enable row level security;
alter table public.payment_orders enable row level security;

-- plans: leitura pública apenas dos ativos
drop policy if exists "plans_public_read" on public.plans;
create policy "plans_public_read"
on public.plans
for select
to anon, authenticated
using (active = true);

-- pages: leitura pública apenas de páginas ativas e não expiradas
drop policy if exists "pages_public_read_active" on public.pages;
create policy "pages_public_read_active"
on public.pages
for select
to anon, authenticated
using (
  status = 'active'
  and (expires_at is null or expires_at > now())
);

-- page_photos: leitura pública apenas se a page-mãe for ativa
drop policy if exists "page_photos_public_read_active" on public.page_photos;
create policy "page_photos_public_read_active"
on public.page_photos
for select
to anon, authenticated
using (
  exists (
    select 1 from public.pages p
    where p.id = page_photos.page_id
      and p.status = 'active'
      and (p.expires_at is null or p.expires_at > now())
  )
);

-- payment_orders: nenhum acesso anon/authenticated. Apenas service_role (bypass RLS).
-- (sem políticas = nega tudo)

-- INSERT/UPDATE/DELETE: NENHUMA policy criada para anon/authenticated em qualquer tabela.
-- Logo, todas as mutações exigem service_role (Edge Functions).

-- =========================================================
-- Seed plans
-- =========================================================
insert into public.plans (id, display_name, price_cents, duration_days, max_photos, max_message_length, active)
values
  ('forever', 'Para sempre',     3100, null, 8, 1500, true),
  ('annual',  'Anual (1 ano)',   2100, 365, 4, 1000, true)
on conflict (id) do update
  set display_name       = excluded.display_name,
      price_cents        = excluded.price_cents,
      duration_days      = excluded.duration_days,
      max_photos         = excluded.max_photos,
      max_message_length = excluded.max_message_length,
      active             = excluded.active;
