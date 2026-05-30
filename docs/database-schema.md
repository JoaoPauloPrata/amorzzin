# Schema do Banco

Postgres 17 (Supabase). Migrations em [`../supabase/migrations/`](../supabase/migrations).

## Diagrama lógico

```
plans (id)
  │
  └─< pages (plan_id)
        │
        ├─< page_photos (page_id ON DELETE CASCADE)
        │
        └─< payment_orders (page_id, plan_id)
```

## Tabelas

### `plans` — catálogo de planos (público)

| Coluna               | Tipo          | Notas                                       |
| -------------------- | ------------- | ------------------------------------------- |
| `id`                 | `text` PK     | Slug do plano: `forever`, `annual`          |
| `display_name`       | `text`        | Nome exibido                                |
| `price_cents`        | `int`         | Preço em centavos (BRL)                     |
| `duration_days`      | `int` NULL    | NULL = vitalício; senão expira em N dias    |
| `max_photos`         | `int`         | Limite de fotos no carrossel                |
| `max_message_length` | `int`         | Limite de chars da mensagem (default 1000)  |
| `active`             | `bool`        | Soft-delete                                 |
| `created_at`         | `timestamptz` |                                             |

**Seed:**

| id        | display_name | price_cents | duration_days | max_photos | max_msg |
| --------- | ------------ | ----------- | ------------- | ---------- | ------- |
| `monthly` | Mensal       | 1100        | 30            | 4          | 800     |
| `annual`  | Anual        | 2100        | 365           | 8          | 1500    |

> Plano `forever` (vitalício) foi removido em `0004_replace_forever_with_monthly.sql` — custo de manter infra indefinidamente é incerto.

### `pages` — conteúdo da página

| Coluna                    | Tipo          | Notas                                                   |
| ------------------------- | ------------- | ------------------------------------------------------- |
| `id`                      | `uuid` PK     | Default `gen_random_uuid()`                             |
| `slug`                    | `text` UNIQUE | Default `generate_unique_slug()` — usado em `/p/<slug>` |
| `edit_token`              | `uuid`        | Secreto. Default `gen_random_uuid()`                    |
| `status`                  | `text` CHECK  | `draft` \| `pending_payment` \| `active` \| `expired` \| `disabled` |
| `plan_id`                 | `text` FK     | → `plans.id`                                            |
| `title`                   | `text`        | Ex: "Pra minha Joana"                                   |
| `recipient_name`          | `text`        |                                                         |
| `message`                 | `text`        | Texto principal                                         |
| `relationship_start`      | `date`        | Base do contador de tempo                               |
| `music_embed_url`         | `text`        | URL YouTube/Spotify validada                            |
| `music_provider`          | `text` CHECK  | `youtube` \| `spotify`                                  |
| `animation_type`          | `text` CHECK  | `hearts` \| `heart_eyes` \| `custom`                    |
| `animation_custom_emoji`  | `text`        | 1-2 chars                                               |
| `carousel_style`          | `text` CHECK  | `fade` \| `slide` \| `zoom` \| `flip` \| `coverflow`    |
| `contact_email`           | `text`        |                                                         |
| `contact_phone`           | `text`        |                                                         |
| `activated_at`            | `timestamptz` | Setado no webhook approved                              |
| `expires_at`              | `timestamptz` | `activated_at + duration_days` (NULL = vitalício)       |
| `created_at` / `updated_at` | `timestamptz` | Trigger `set_updated_at`                              |

**Índices:**

- `pages_status_idx`
- `pages_status_expires_idx` — filtro composto da policy pública
- `pages_contact_email_idx` — `/recuperar`
- `pages_created_at_idx`
- UNIQUE em `slug`

### `page_photos`

| Coluna         | Tipo  | Notas                                              |
| -------------- | ----- | -------------------------------------------------- |
| `id`           | uuid  |                                                    |
| `page_id`      | uuid  | FK → `pages.id` ON DELETE CASCADE                  |
| `storage_path` | text  | Path dentro do bucket `page-photos`                |
| `position`     | int   | Ordem no carrossel                                 |
| UNIQUE         |       | `(page_id, position)`                              |

### `payment_orders`

| Coluna                  | Tipo   | Notas                                          |
| ----------------------- | ------ | ---------------------------------------------- |
| `id`                    | uuid   |                                                |
| `page_id`               | uuid   | FK → `pages.id`                                |
| `plan_id`               | text   | FK → `plans.id`                                |
| `amount_cents`          | int    | Snapshot do preço no momento da compra         |
| `status`                | text   | `pending` \| `approved` \| `rejected` \| `refunded` \| `cancelled` |
| `mp_preference_id`      | text   | ID da preference MP                            |
| `mp_payment_id`         | text UNIQUE | Idempotência do webhook                   |
| `mp_external_reference` | text   | Echo via MP                                    |
| `raw_payload`           | jsonb  | Última notificação webhook (debug/audit)       |

## Funções

### `public.generate_unique_slug() -> text`

`SECURITY INVOKER`, `search_path = ''` (anti-hijack). Gera string de 6-8 chars `[a-z0-9]` via `extensions.gen_random_bytes(6)` + filter. Loop até unique.

### `public.set_updated_at()`

Trigger `BEFORE UPDATE`. Seta `new.updated_at = now()`.

## Regenerar tipos TS

```bash
# Via MCP no Claude:
mcp__supabase__generate_typescript_types

# Ou CLI:
supabase gen types typescript --project-id juyvgtgbpxxiuozeiwez > src/lib/supabase/database.types.ts
```

Sempre regerar após nova migration.
