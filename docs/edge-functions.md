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
- **Input:** `{ id, edit_token, ...patch }`. Patch aceita `recipient_name`, `title`, `message`, `relationship_start`, `contact_email`, `contact_phone`, `music_embed_url` (nullable), `music_provider` (nullable; só `youtube` na prática — Spotify descontinuado), `plan_id`, `layout_style` (`immersive|polaroid|editorial|gallery`), `sections[]` (≤8, `{title,body}`).
- **Output:** `{ ok: true } | { ok: false, error }`
- **Validações:** match `edit_token`; status ∉ {`active`, `expired`}
- **Side-effects:** UPDATE em `pages`

### `uploadPhoto` (Fase 4 — IMPLEMENTADO)

- **Arquivo:** `src/app/criar/photo-actions.ts`
- **Input:** `FormData` com `page_id`, `edit_token`, `file`
- **Output:** `{ ok: true, photo: { id, position, url, storagePath } } | { ok: false, error }`
- **Validações:** match `edit_token`; status ∉ {`active`,`expired`}; MIME ∈ {`image/jpeg|png|webp|heic`}; size ≤ 5 MB; count(`page_photos`) < limite (do plano se houver; fallback `PHOTO_FALLBACK_MAX = 8`)
- **Reprocessamento:** `sharp` antes do upload — orienta EXIF, reduz lado maior ≤1600px, converte pra **WebP** q80, descarta metadados (fallback pro original se falhar). Upload com `cacheControl: 31536000` (1 ano). Corta storage/egress. Requer `bodySizeLimit: "6mb"` no `next.config.mjs` (default 1 MB rejeitaria >1 MB).
- **Side-effects:** upload `page-photos/<page_id>/<uuid>.webp` + INSERT `page_photos`

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
- **Uso:** polling em `/payment/return` (2s × 60s). **Passivo** — só lê `payment_orders.status` do banco (não consulta o MP). Cobre webhook que chega DENTRO da janela; webhook perdido/atrasado além disso é recuperado pelo cron `reconcile-payments`. (Backlog: tornar o polling ativo single-page; pré-requisito do bypass interno já está pronto.)

---

## Edge Functions (Deno)

### `mp-webhook` (Fase 6 — IMPLEMENTADO)

- **Caminho:** `supabase/functions/mp-webhook/index.ts`
- **Deploy:** via `mcp__supabase__deploy_edge_function`. `verify_jwt=false` porque autenticação é HMAC, não JWT.
- **URL:** `https://<project-ref>.supabase.co/functions/v1/mp-webhook`
- **Método:** POST público (aceita GET pra ping)
- **Headers:** `x-signature` (`ts=…,v1=…`) + `x-request-id` (webhook real do MP); ou `x-internal-secret` (chamador interno, ver abaixo)
- **Body:** payload MercadoPago (formato v2: `{ action, data: { id } }`) ou legacy
- **Retorno:** `200 OK` em todos casos não-críticos (MP re-tenta a cada 15min em qualquer outro código); `401` se assinatura obrigatória falhar
- **Side-effects:**
  - Extrai paymentId de `data.id`, `id` query param ou `body.data.id`
  - Filtra topic ≠ `payment*` (responde 200 ignored)
  - GET `https://api.mercadopago.com/v1/payments/<id>` com `Bearer ${MP_ACCESS_TOKEN}` (fonte de verdade autenticada)
  - UPDATE order existente (selecionada pelo `page_id` = `external_reference`) OU INSERT fallback
  - Se status mapeado = `approved`: ativa a página (`status='active'`, `activated_at=now()`, `expires_at = now() + plans.duration_days`) **e dispara `send-confirmation-email`** (idempotente). Falha de e-mail não derruba o webhook.
- **Enforcement de assinatura (por ambiente):**
  - HMAC SHA-256 sobre `id:<dataId_lowercase>;request-id:<x-request-id>;ts:<ts>;` com `MP_WEBHOOK_SECRET` (constant-time).
  - `WEBHOOK_SKIP_SIGNATURE=true` → ignora (ambiente de teste; **remover pré-launch**).
  - senão `payment.live_mode=true` (produção) → assinatura **obrigatória**, `401` se inválida/ausente.
  - senão `live_mode=false` (teste) → assinatura opcional.
- **Bypass interno (`x-internal-secret`):** re-injeções server-to-server (cron `reconcile-payments`, futuro polling) **não** carregam a `x-signature` do MP e em produção seriam rejeitadas com 401. O chamador manda `x-internal-secret` = segredo do Vault `reconcile_cron_secret`, validado via RPC `verify_reconcile_secret`; quando válido, dispensa a assinatura (a busca autenticada no MP já garante que o pagamento é real). Corrigido em mp-webhook v18 / reconcile v5 (01/06/2026).
- **Status mapping:** approved/authorized → approved; rejected → rejected; refunded/charged_back → refunded; cancelled/expired → cancelled; resto → pending

### `send-confirmation-email` (Fase 7 — IMPLEMENTADO)

- **Caminho:** `supabase/functions/send-confirmation-email/index.ts` (`verify_jwt=false`)
- **Invocada por:** `mp-webhook` (interna) e `reconcile-payments` (via re-injeção no webhook)
- **Body:** `{ page_id }`
- **Auth:** `Bearer` service_role **ou** segredo do Vault validado por `verify_reconcile_secret`.
- **Idempotência:** claim atômico em `pages.email_sent_at` (`UPDATE ... WHERE email_sent_at IS NULL ... returning`). 2ª chamada vira no-op (early return). Em falha de envio, reverte o claim.
- **Side-effects:**
  - Gera QR Code PNG → upload `page-qrcodes/<page_id>.png`
  - Envia e-mail via Resend (`from: RESEND_FROM`) com link `/p/<slug>` + QR Code anexado
- **Falha Resend:** `throw` → 500 genérico `"send failed"` + reverte claim (não vaza erro do provedor).
- **Prod TODO:** domínio `amorzzin.com` verificado; falta rotacionar `RESEND_API_KEY`.

### `reconcile-payments` (Fase 9 — cron, IMPLEMENTADO)

- **Caminho:** `supabase/functions/reconcile-payments/index.ts` (`verify_jwt=false`)
- **Trigger:** pg_cron `*/5 * * * *` via pg_net (migration `0008`); `Authorization: Bearer <reconcile_cron_secret do Vault>`, validado por `verify_reconcile_secret` (migration `0007`).
- **Lógica:** acha `pages` presas em `pending_payment` (janela 3min–24h, lote 50); pra cada uma busca no MP por `external_reference=page_id`; se houver pagamento `approved`, **re-injeta no `mp-webhook`** (`?data.id=…&type=payment` + header `x-internal-secret`) — que faz ativação + e-mail idempotentes. **Não duplica** a lógica de ativação (1 fonte de verdade).
- **Retorno:** `{ ok, checked, recovered }`.

### `cleanup-drafts` (Fase 9 — cron, IMPLEMENTADO)

- **Trigger:** pg_cron (migration `0009`)
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
