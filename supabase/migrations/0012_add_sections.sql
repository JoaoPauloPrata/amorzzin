-- 0012_add_sections.sql
-- Seções extras da página (além da mensagem principal). Array de { title, body }.
-- Renderizadas como blocos que revelam no scroll da página pública.

alter table public.pages
  add column if not exists sections jsonb not null default '[]'::jsonb;

comment on column public.pages.sections is
  'Seções extras: jsonb array de {title, body}. Renderizadas no scroll da página pública.';
