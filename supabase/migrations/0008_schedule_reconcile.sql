-- 0008_schedule_reconcile.sql
-- Fase 9: agenda o job reconcile-payments a cada 5 minutos.
--
-- cron.schedule é idempotente por nome (substitui se já existir). O Authorization lê
-- o segredo do Vault em runtime — o valor literal NÃO fica gravado em cron.job, só a
-- subquery que o busca.
--
-- NOTA: a URL do projeto está chumbada. Ao restaurar noutro projeto, ajustar o host.

select cron.schedule(
  'reconcile-payments',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url := 'https://juyvgtgbpxxiuozeiwez.supabase.co/functions/v1/reconcile-payments',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reconcile_cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
