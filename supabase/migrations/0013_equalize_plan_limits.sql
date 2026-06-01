-- 0013_equalize_plan_limits.sql
-- Planos passam a diferir só em preço e duração; benefícios idênticos.
-- monthly sobe pra 8 fotos e 1500 chars — alinha com annual e com o limite real
-- de mensagem (1500) já aplicado no wizard/schema. Idempotente.
update public.plans set max_photos = 8, max_message_length = 1500 where id = 'monthly';
update public.plans set max_photos = 8, max_message_length = 1500 where id = 'annual';
