-- 0014_update_plan_prices.sql
-- Define preços finais de lançamento (saindo dos valores de teste 50/75 centavos).
-- monthly = R$ 14,99 · annual = R$ 21,99. Idempotente.
update public.plans set price_cents = 1499 where id = 'monthly';
update public.plans set price_cents = 2199 where id = 'annual';
