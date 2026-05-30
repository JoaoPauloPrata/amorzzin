# Segurança & RLS

## Princípio

> **Anon e authenticated leem apenas conteúdo `active`. Toda mutação passa por Edge Function com `service_role`.**

Não usamos `supabase.auth`. O `authenticated` role nunca aparece — só anon (público) e service_role (servidor).

## Roles efetivos

| Role            | Onde                              | O que pode fazer                                  |
| --------------- | --------------------------------- | ------------------------------------------------- |
| `anon`          | Browser (Next client / SSR)       | SELECT em `plans` (active), `pages` (active), `page_photos` (de pages active). Nada de INSERT/UPDATE/DELETE. |
| `service_role`  | Edge Functions (Deno)             | Bypass total de RLS. Valida `edit_token` manualmente antes de mutar. |
| `authenticated` | (não usado)                       | —                                                 |

## Policies

### `plans`

```sql
-- leitura pública dos ativos
create policy "plans_public_read"
on public.plans for select to anon, authenticated
using (active = true);
```

### `pages`

```sql
-- leitura pública apenas ativas e não expiradas
create policy "pages_public_read_active"
on public.pages for select to anon, authenticated
using (
  status = 'active'
  and (expires_at is null or expires_at > now())
);
```

`edit_token` é coluna pública do schema, **mas a leitura é negada em rascunhos/inativos**. Para ler `edit_token` de uma página `draft`, é obrigatório passar pela Edge (`service_role`).

### `page_photos`

```sql
-- leitura via JOIN: foto visível só se page é active
create policy "page_photos_public_read_active"
on public.page_photos for select to anon, authenticated
using (
  exists (
    select 1 from public.pages p
    where p.id = page_photos.page_id
      and p.status = 'active'
      and (p.expires_at is null or p.expires_at > now())
  )
);
```

### `payment_orders`

**Sem nenhuma policy.** RLS habilitado → nega tudo para anon. Apenas `service_role` (Edge) acessa. Advisor flagga isso como `INFO` — comportamento esperado, ignorado.

## `edit_token` — modelo de autorização

1. `create-page` retorna `{ id, slug, edit_token }`. Front guarda `edit_token` em `sessionStorage`.
2. Todo mutation (Edge Function) recebe `edit_token` no body. Compara com `pages.edit_token` via `service_role`.
3. Mismatch → `401 Unauthorized`.
4. Não há rate limit por enquanto — Edge é caro o suficiente pra desincentivar brute force, mas se virar problema, adicionar throttle por IP no webhook gateway.

```ts
// padrão dentro de cada Edge Function de mutation
const { page_id, edit_token, ...patch } = await req.json();

const { data: page, error } = await supabaseAdmin
  .from("pages")
  .select("id, edit_token")
  .eq("id", page_id)
  .single();

if (error || !page || page.edit_token !== edit_token) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}

// só agora aplica patch
```

## Storage

- `page-photos` — bucket **público**. URLs `/object/public/...` não precisam de policy. Uploads/deletes via service_role.
- `page-qrcodes` — bucket **privado**. Acesso apenas via Edge gerando signed URL temporário no e-mail.

Detalhes em [`storage.md`](./storage.md).

## Webhook MercadoPago

- Rota Edge `mp-webhook` **pública** (MP não suporta auth header customizada). Proteção:
  1. Header `x-signature` HMAC validado contra `MP_WEBHOOK_SECRET`.
  2. `mp_payment_id UNIQUE` impede duplicação mesmo se header for forjado.
  3. Após validar HMAC, **buscar o pagamento via API MP** com `MP_ACCESS_TOKEN` — única fonte de verdade. Body do webhook é só "ping".

## Service Role Key

- **Nunca** em `.env.local` que seja referenciado pelo Next runtime.
- Setado via `supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...` (escopo: Edge Functions).
- O `.env.local` mantém placeholder vazio só por documentação. Se preencher, **não usar em código que rode no browser ou em Server Component público**.

## Lista de verificação a cada nova feature

- [ ] A tabela tem `enable row level security`?
- [ ] Toda mutação passa por Edge Function?
- [ ] Edge valida `edit_token` antes de mutar?
- [ ] Toda leitura pública só retorna conteúdo `active`?
- [ ] Storage uploads só via service_role?
- [ ] Rodou `mcp__supabase__get_advisors` após a migration?
