# Amorzin v2

Páginas personalizadas para presentear quem você ama. O usuário escreve um título, mensagem, data inicial do relacionamento, sobe fotos e (opcional) escolhe uma música. Após pagar, recebe por e-mail o link público + QR Code da página.

## Stack

| Camada       | Tecnologia                                              |
| ------------ | ------------------------------------------------------- |
| Frontend     | Next.js 16 (App Router) + TypeScript + Tailwind CSS     |
| Estado       | Zustand (wizard) + React Hook Form + Zod                |
| Animação     | Framer Motion                                           |
| Backend      | Supabase (Postgres + Storage + Edge Functions — **sem Auth**) |
| Pagamento    | MercadoPago Checkout Pro + Webhook (Edge Function)      |
| E-mail       | Resend (transactional)                                  |
| Hosting      | Vercel                                                  |
| Domínio      | `amorzzin.com` (live; `www` + apex)                     |

## Princípios

- **Sem autenticação obrigatória.** Usuário anônimo cria → paga com e-mail → recebe link público.
- **`edit_token`** UUID secreto autoriza mutações na página antes do pagamento.
- **RLS estrita.** Leitura pública apenas de conteúdo `active`. Toda mutação passa por Edge Function com `service_role`.
- **Slug público vs. ID secreto.** URL `/p/<slug>` é o que circula no WhatsApp. `edit_token` nunca aparece em leituras.
- **Idempotência via `mp_payment_id UNIQUE`.** Webhook MercadoPago pode chegar N vezes sem duplicar pedido.

## Quickstart

```bash
# instalar deps
npm install

# popular .env.local (copiar de .env.example e preencher)
cp .env.example .env.local

# dev server
npm run dev   # http://localhost:3000

# typecheck
npx tsc --noEmit
```

Variáveis de ambiente: ver [`.env.example`](./.env.example).

## Documentação

Toda a doc viva fica em [`docs/`](./docs):

- [`architecture.md`](./docs/architecture.md) — visão geral, fluxo end-to-end, decisões
- [`database-schema.md`](./docs/database-schema.md) — tabelas, colunas, índices
- [`security-rls.md`](./docs/security-rls.md) — modelo de segurança, RLS, `edit_token`
- [`storage.md`](./docs/storage.md) — buckets, políticas, paths
- [`development.md`](./docs/development.md) — setup local, migrations, comandos
- [`conventions.md`](./docs/conventions.md) — convenções de código, naming, estrutura
- [`edge-functions.md`](./docs/edge-functions.md) — catálogo de funções (preenchido em cada fase)

## Roadmap

Ver [`../PLANO.md`](../PLANO.md) seção 16.

- ✅ Fase 0 — Setup
- ✅ Fase 1 — Schema + Storage + RLS
- ✅ Fase 2 — Landing
- ✅ Fase 3 — Wizard texto
- ✅ Fase 4 — Upload fotos
- 🟡 Fase 5 — Steps restantes (Música ✅, Plan ✅, Review ✅; Animation pendente)
- ✅ Fase 6 — Pagamento (createPaymentPreference + /payment/return + mp-webhook deployed)
- ✅ Fase 7 — QR + E-mail (idempotente via `email_sent_at`; Resend domínio `amorzzin.com` verificado)
- ✅ Fase 8 — Página pública (4 layouts: immersive/polaroid/editorial/gallery + seções)
- 🟡 Fase 9 — Polimento (✅ reconcile-payments cron, cleanup-drafts cron, otimização de imagem sharp→WebP, deploy Vercel; ⏳ anti-abuso Turnstile+ratelimit, rotacionar RESEND_API_KEY, remover WEBHOOK_SKIP_SIGNATURE, token MP de produção)

> **Estado live (jun/2026):** deployado em `amorzzin.com`. Ainda em validação pré-produção total — ver pendências de go-live na Fase 9.
