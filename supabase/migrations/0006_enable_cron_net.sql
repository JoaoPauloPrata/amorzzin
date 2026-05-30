-- 0006_enable_cron_net.sql
-- Fase 9: habilita pg_cron (agendador no banco) + pg_net (HTTP async do Postgres).
-- Usados pelo job reconcile-payments: cron dispara periodicamente e via pg_net
-- chama a Edge Function que recupera pagamentos cujo webhook se perdeu.

create extension if not exists pg_cron;
create extension if not exists pg_net;
