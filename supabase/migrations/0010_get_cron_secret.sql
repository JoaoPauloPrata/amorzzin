-- 0010_get_cron_secret.sql
-- Fase 9: permite o servidor Next chamar Edge Functions internas (ex.: reenvio de
-- email em /recuperar) autenticando com o segredo de cron do Vault.
--
-- Retorna o segredo. SECURITY DEFINER, execução só pra service_role (o Next usa
-- service_role; anon/authenticated não acessam).

create or replace function public.get_cron_secret()
returns text
language sql
security definer
set search_path = vault, public
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'reconcile_cron_secret';
$$;

revoke all on function public.get_cron_secret() from public;
revoke all on function public.get_cron_secret() from anon;
revoke all on function public.get_cron_secret() from authenticated;
grant execute on function public.get_cron_secret() to service_role;
