# Arquitetura

## Atores

- **Criador (Comprador)** — anônimo. Preenche wizard, paga, recebe link por e-mail.
- **Destinatário (Visitante)** — anônimo. Abre o link público, vê a página.
- **MercadoPago** — gateway. Notifica via webhook.
- **Resend** — envia e-mail transacional pós-pagamento.

## Componentes

```
┌────────────────────────┐         ┌──────────────────────────────────┐
│  Next.js (Vercel)      │         │  Supabase                        │
│                        │         │                                  │
│  /         landing     │ ───────▶│  Postgres                        │
│  /criar    wizard      │  SELECT │   plans, pages, page_photos,     │
│  /p/[slug] página pub  │  (anon) │   payment_orders                 │
│                        │         │                                  │
│  Server Actions ──────▶│ service │  (mutations Postgres + Storage)  │
│   createPage           │  role   │                                  │
│   updatePage                                                        │
│   uploadPhoto / deletePhoto                                         │
│   createPaymentPreference                                           │
│                                  │  Edge Functions (Deno) ─────────│
│                                  │   mp-webhook (publica, sem auth) │
│                                  │   send-confirmation-email        │
│                                  │                                  │
│                                  │  Storage                         │
│                                  │   page-photos (public)           │
│                                  │   page-qrcodes (private)         │
└────────────────────────┘         └──────────────────────────────────┘
                                          │           ▲
                                          ▼           │ webhook
                                   ┌─────────────────────────┐
                                   │  MercadoPago / Resend   │
                                   └─────────────────────────┘
```

## Onde rodam as mutations

| Tipo                                | Onde                            | Por quê                                                                |
| ----------------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| Wizard (createPage, updatePage)     | Server Actions Next (Vercel)    | Type-safe ponta-a-ponta, sem CORS, mesmo deploy do front, DX melhor    |
| Upload/delete foto                  | Server Actions Next (Vercel)    | Mesmo deploy, type-safe                                                |
| Criar preference de pagamento       | Server Action Next (Vercel)     | Idem                                                                   |
| Webhook MercadoPago (`mp-webhook`)  | Edge Function Supabase (Deno)   | Precisa endpoint público sem CORS, MP chama sem auth header — Server Action exigiria proxy |
| Envio de e-mail (`send-confirmation-email`) | Edge Function Supabase (Deno)   | Chamada pelo webhook acima — fica isolada na mesma camada              |

Service-role key fica em env do Vercel (Server Actions) **e** em `supabase secrets` (Edge Functions). Nunca exposta ao browser.

## Fluxo end-to-end

1. **Criar** — `createPage` (Server Action) recebe campos iniciais, gera `edit_token`, status `draft`. Front guarda `edit_token` em `sessionStorage`.
2. **Editar texto/fotos** — `updatePage` (Server Action) e `uploadPhoto` (Server Action) validam `edit_token`.
3. **Pagar** — `createPaymentPreference` (Server Action) cria pedido MP + insere `payment_orders` (status `pending`), redireciona para Checkout Pro.
4. **Webhook** — MP chama `mp-webhook` (Edge). Valida HMAC, busca pagamento via API MP, atualiza `payment_orders.status`. Se `approved`:
   - `pages.status = 'active'`, `activated_at = now()`, `expires_at = now() + duration_days` (NULL na coluna = sem expiração — coluna mantida nullable pra promo/giveaway futuro, mas nenhum plano ativo usa NULL).
   - Invoca `send-confirmation-email`.
5. **E-mail** — Resend manda HTML com link `https://amorzzin.com/p/<slug>` + QR Code anexado (gerado por `qrcode` npm, salvo em bucket `page-qrcodes`).
6. **Visualizar** — `/p/[slug]` Server Component SSR + ISR (`revalidate=60`). `opengraph-image.tsx` gera preview dinâmico pra WhatsApp/Instagram.

## Identidade sem auth

| Necessidade               | Solução                                                       |
| ------------------------- | ------------------------------------------------------------- |
| Criador edita rascunho    | `edit_token` (UUID) em `sessionStorage` + body de cada request|
| Página tem URL pública    | `slug` curto (8 chars base64) gerado no INSERT                |
| Webhook MP é confiável    | HMAC signature header                                         |
| Idempotência webhook      | `mp_payment_id UNIQUE` constraint                             |
| Recuperação de link       | `/recuperar` → e-mail → reenviar link (Fase 9)                |

## Decisões registradas

| Decisão                          | Razão                                                     |
| -------------------------------- | --------------------------------------------------------- |
| Next.js 16 (vs Vite)             | `opengraph-image.tsx` dinâmico, ISR, Edge runtime         |
| Tailwind CSS (vs CSS Modules)    | Iteração rápida em landing/marketing                      |
| Supabase (vs self-host PG)       | Storage + Postgres + Edge integrados, RLS nativo          |
| MercadoPago (vs Stripe)          | Pix nativo, mercado BR                                    |
| Resend (vs SES)                  | DX, dev mode com domínio sandbox                          |
| Zustand + sessionStorage         | Wizard de N passos sem perder estado em refresh           |
| Sem Auth                         | UX: comprador anônimo, link pago = "posse" da página     |
| Slug 8 chars                     | Curto pra WhatsApp; ~218 trilhões de combinações          |

## Limites conhecidos

- Sem auth = não dá pra "ver minhas páginas". Resolve com `/recuperar` (Fase 9).
- `sessionStorage` perde no fechamento do tab antes do pagamento. Aceitável (rascunho descartado).
- Free tier Supabase Storage = 1GB. Monitorar conforme uso.
