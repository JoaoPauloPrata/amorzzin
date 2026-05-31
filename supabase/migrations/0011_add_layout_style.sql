-- 0011_add_layout_style.sql
-- Estilo de layout da página pública. 4 opções; default mantém o comportamento atual
-- (imersivo: fotos no fundo).

alter table public.pages
  add column if not exists layout_style text not null default 'immersive'
  check (layout_style in ('immersive','polaroid','editorial','gallery'));

comment on column public.pages.layout_style is
  'Layout da página pública: immersive (foto fundo) | polaroid | editorial | gallery.';
