-- 0007_reconcile_cron_secret.sql
-- Fase 9: auth do job reconcile-payments.
--
-- A Edge Function reconcile-payments roda com verify_jwt=false (chamada pelo cron via
-- pg_net). Não dá pra autenticar por igualdade do service_role (o projeto pode ter
-- múltiplas chaves válidas após rotação). Em vez disso: um segredo aleatório no Vault,
-- que o cron envia no header e a função valida no banco — sem o segredo nunca sair do DB.

-- Segredo aleatório no Vault (só cria se não existir).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'reconcile_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'reconcile_cron_secret');
  end if;
end $$;

-- Verifica o token recebido contra o segredo do Vault, sem nunca devolvê-lo.
-- SECURITY DEFINER pra ler vault.decrypted_secrets; execução só pra service_role.
create or replace function public.verify_reconcile_secret(p_token text)
returns boolean
language sql
security definer
set search_path = vault, public
as $$
  select p_token is not null
     and p_token = (select decrypted_secret from vault.decrypted_secrets where name = 'reconcile_cron_secret');
$$;

revoke all on function public.verify_reconcile_secret(text) from public;
revoke all on function public.verify_reconcile_secret(text) from anon;
revoke all on function public.verify_reconcile_secret(text) from authenticated;
grant execute on function public.verify_reconcile_secret(text) to service_role;
