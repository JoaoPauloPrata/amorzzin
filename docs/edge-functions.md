# Catálogo de Edge Functions & Server Actions

Mutations distribuídas em duas camadas:

| Camada                              | Onde                          | Quando usar                                          |
| ----------------------------------- | ----------------------------- | ---------------------------------------------------- |
| **Server Actions** (`"use server"`) | Vercel, junto do Next         | Tudo que vier do wizard ou do front autenticado pelo `edit_token` |
| **Edge Functions** (Deno)           | Supabase, `supabase/functions/`| Endpoints públicos consumidos por terceiros (webhook MP) ou chamadas internas isoladas (e-mail) |

---

## Server Actions

### `createPage` (Fase 3 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/actions.ts`
- **Input:** `{ recipient_name?, title? }`
- **Output:** `{ ok: true, id, slug, edit_token } | { ok: false, error }`
- **Side-effects:** INSERT em `pages` com status `draft`
- **Auth:** nenhuma — anônimo

### `updatePage` (Fase 3 — IMPLEMENTADO, ampliado nas Fases 5+)

- **Arquivo:** `src/app/criar/actions.ts`
- **Input:** `{ id, edit_token, ...patch }`. Patch aceita `recipient_name`, `title`, `message`, `relationship_start`, `contact_email`, `contact_phone`, `music_embed_url` (nullable), `music_provider` (nullable, `youtube|spotify`).
- **Output:** `{ ok: true } | { ok: false, error }`
- **Validações:** match `edit_token`; status ∉ {`active`, `expired`}
- **Side-effects:** UPDATE em `pages`

### `uploadPhoto` (Fase 4 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/photo-actions.ts`
- **Input:** `FormData` com `page_id`, `edit_token`, `file`
- **Output:** `{ ok: true, photo: { id, position, url, storagePath } } | { ok: false, error }`
- **Validações:** match `edit_token`; status ∉ {`active`,`expired`}; MIME ∈ {`image/jpeg|png|webp|heic`}; size ≤ 5 MB; count(`page_photos`) < limite (do plano se houver; fallback `PHOTO_FALLBACK_MAX = 8`)
- **Side-effects:** upload `page-photos/<page_id>/<uuid>.<ext>` + INSERT `page_photos`

### `deletePhoto` (Fase 4 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/photo-actions.ts`
- **Input:** `{ page_id, edit_token, photo_id }`
- **Output:** `{ ok: true } | { ok: false, error }`
- **Side-effects:** DELETE row + `storage.remove` do object + RPC `resequence_page_photos` pra compactar positions

### `listPhotos` (Fase 4 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/photo-actions.ts`
- **Input:** `{ page_id, edit_token }`
- **Output:** `{ ok: true, photos: PhotoDTO[], maxPhotos } | { ok: false, error }`
- **Uso:** hidratação inicial do `Step4Photos` em refresh / navegação

### `reorderPhotos` (Fase 4 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/photo-actions.ts`
- **Input:** `{ page_id, edit_token, ordered_ids: uuid[] }`
- **Output:** `{ ok: true } | { ok: false, error }`
- **Side-effects:** RPC `reorder_page_photos` (atômica, valida `edit_token` no banco também)

### `createPaymentPreference` (Fase 6 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/payment-actions.ts`
- **Input:** `{ page_id, edit_token, plan_id }`
- **Output:** `{ ok: true, init_point, preference_id } | { ok: false, error }`
- **Validações:** `edit_token`, `pages.status ∉ {active, expired}`, `contact_email` exigido, `plan` ativo
- **Side-effects:**
  - Deleta orders `pending` antigas da página (limpeza)
  - Cria preference no MercadoPago via SDK Node (`mercadopago`)
  - INSERT `payment_orders` (`status='pending'`, `mp_preference_id`, `mp_external_reference=page_id`)
  - UPDATE `pages.status='pending_payment'`, `pages.plan_id`
- **Notes:** `external_reference=page_id` é o que o webhook usa pra localizar a página. `notification_url` aponta pra `${SUPABASE_URL}/functions/v1/mp-webhook`.

### `listPlans` (Fase 6 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/plan-actions.ts`
- **Input:** —
- **Output:** `{ ok: true, plans: PlanDTO[] } | { ok: false, error }`
- **Uso:** carrega catálogo do Step Plan + Step Review

### `getPaymentOrderStatus` (Fase 6 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/payment-actions.ts`
- **Input:** `{ page_id, edit_token }`
- **Output:** `{ ok: true, status, page_status, slug } | { ok: false, error }`
- **Uso:** polling em `/payment/return` (2s × 60s) cobrindo casos de webhook atrasado/perdido

---

## Edge Functions (Deno)

### `mp-webhook` (Fase 6 — IMPLEMENTADO)

- **Caminho:** `supabase/functions/mp-webhook/index.ts`
- **Deploy:** via `mcp__supabase__deploy_edge_function`. `verify_jwt=false` porque autenticação é HMAC, não JWT.
- **URL:** `https://<project-ref>.supabase.co/functions/v1/mp-webhook`
- **Método:** POST público (aceita GET pra ping)
- **Headers:** `x-signature` (`ts=…,v1=…`) + `x-request-id`
- **Body:** payload MercadoPago (formato v2: `{ action, data: { id } }`) ou legacy
- **Retorno:** `200 OK` em todos casos não-críticos (MP re-tenta a cada 15min em qualquer outro código)
- **Side-effects:**
  - Extrai paymentId de `data.id`, `id` query param ou `body.data.id`
  - Filtra topic ≠ `payment*` (responde 200 ignored)
  - Valida HMAC SHA-256 sobre template `id:<dataId_lowercase>;request-id:<x-request-id>;ts:<ts>;` com `MP_WEBHOOK_SECRET` (constant-time compare)
  - GET `https://api.mercadopago.com/v1/payments/<id>` com `Bearer ${MP_ACCESS_TOKEN}`
  - UPDATE order existente (selecionada pelo `page_id` = `external_reference`) OU INSERT fallback
  - Se status mapeado = `approved`: UPDATE `pages` `status='active'`, `activated_at=now()`, `expires_at = now() + plans.duration_days`
  - **NÃO** dispara e-mail (Fase 7)
- **Status mapping:** approved/authorized → approved; rejected → rejected; refunded/charged_back → refunded; cancelled/expired → cancelled; resto → pending

### `send-confirmation-email` (Fase 7)

- **Caminho:** `supabase/functions/send-confirmation-email/index.ts`
- **Invocada por:** `mp-webhook` (interna)
- **Body:** `{ page_id }`
- **Side-effects:**
  - Gera QR Code PNG → upload `page-qrcodes/<page_id>.png`
  - Cria signed URL 7d
  - Envia e-mail via Resend com link `/p/<slug>` + QR Code anexado

### `cleanup-drafts` (Fase 9 — cron)

- **Trigger:** pg_cron diário
- **Lógica:** DELETE `pages` WHERE status='draft' AND created_at < now() - interval '7 days'
- **Side-effects:** CASCADE em `page_photos` (rows) + cleanup de objects no Storage

---

## Padrões

### Server Action

```ts
"use server";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { schema } from "@/lib/wizard/schemas";

export async function myAction(input: MyInput): Promise<MyResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = getSupabaseServiceClient();
  // ... validar edit_token, mutar, retornar
}
```

### Edge Function

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  // validar input, mutar via admin, retornar Response JSON
});
```
