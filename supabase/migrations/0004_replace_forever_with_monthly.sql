-- 0004_replace_forever_with_monthly.sql
-- Remove plano 'forever' (vitalicio inviavel = custo infra indefinido).
-- Adiciona 'monthly' como tier de entrada.
-- Atualiza 'annual' para premium tier (mais fotos + texto).

-- Bloqueia operacao se houver pagina ativa no plano forever (preserva contratos pagos).
do $$
declare
  forever_pages int;
begin
  select count(*) into forever_pages
  from public.pages
  where plan_id = 'forever' and status in ('active', 'pending_payment');

  if forever_pages > 0 then
    raise exception 'Ha % paginas active/pending no plano forever. Aborta para preservar contratos.', forever_pages;
  end if;
end;
$$;

-- Remove plano forever (so funciona se sem refs ou refs sao drafts/expired).
-- Drafts referenciando forever: deletar (rascunho descartavel).
delete from public.pages where plan_id = 'forever' and status = 'draft';

delete from public.plans where id = 'forever';

-- Atualiza annual para premium tier.
update public.plans
   set display_name       = 'Anual',
       price_cents        = 2100,
       duration_days      = 365,
       max_photos         = 8,
       max_message_length = 1500
 where id = 'annual';

-- Insere plano mensal.
insert into public.plans (id, display_name, price_cents, duration_days, max_photos, max_message_length, active)
values ('monthly', 'Mensal', 1100, 30, 4, 800, true)
on conflict (id) do update
  set display_name       = excluded.display_name,
      price_cents        = excluded.price_cents,
      duration_days      = excluded.duration_days,
      max_photos         = excluded.max_photos,
      max_message_length = excluded.max_message_length,
      active             = excluded.active;
