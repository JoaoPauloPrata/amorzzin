-- 0009_schedule_cleanup_drafts.sql
-- Fase 9: agenda o job cleanup-drafts diariamente às 03:00 UTC.
--
-- Apaga páginas 'draft'/'pending_payment' com mais de 7 dias e sem pagamento
-- aprovado, junto com fotos e QR no Storage. Reusa o segredo de cron do Vault.
--
-- NOTA: a URL do projeto está chumbada. Ao restaurar noutro projeto, ajustar o host.

select cron.schedule(
  'cleanup-drafts',
  '0 3 * * *',
  $cron$
  select net.http_post(
    url := 'https://juyvgtgbpxxiuozeiwez.supabase.co/functions/v1/cleanup-drafts',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'reconcile_cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $cron$
);
