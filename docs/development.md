# Setup de Desenvolvimento

## Pré-requisitos

- Node 20+
- npm (lockfile do projeto)
- Conta Supabase com acesso ao project `juyvgtgbpxxiuozeiwez`
- (Opcional) Supabase CLI: `npm i -g supabase`

## Primeira vez

```bash
cd amorzin-v2
npm install
cp .env.example .env.local
# preencher .env.local com valores reais (ver seção abaixo)
npm run dev
```

Acessar: <http://localhost:3000>

## Variáveis de ambiente

| Var                              | Onde usar                          | Escopo                       |
| -------------------------------- | ---------------------------------- | ---------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`       | Browser + Server                   | Próprio do projeto Supabase  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Browser + Server                   | Modern key `sb_publishable_…`|
| `SUPABASE_SERVICE_ROLE_KEY`      | Server Actions Next + Edge Functions | Server-only (NUNCA usar em código que rode no browser). Local: `.env.local`. Vercel: env vars. Edge: `supabase secrets set`. |
| `NEXT_PUBLIC_SITE_URL`           | Browser + Server                   | `http://localhost:3000` dev, `https://amorzin.com` prod |
| `SUPABASE_DB_URL`                | CLI (`supabase db push`, psql)     | Connection string Postgres   |
| `MP_ACCESS_TOKEN`                | Server Action `createPaymentPreference` + Edge `mp-webhook` | Local: `.env.local`. Vercel: env vars. Edge: `supabase secrets set`. Use `TEST-…` em dev. |
| `MP_WEBHOOK_SECRET`              | Edge `mp-webhook` apenas           | `supabase secrets set`. Pegar em painel MP > Webhooks > Configurar notificações |
| `RESEND_API_KEY` / `RESEND_FROM` | Edge `send-confirmation-email`     | Set via `supabase secrets set` |

## Scripts NPM

```bash
npm run dev         # Next dev server (turbopack ou webpack conforme config)
npm run build       # Build production
npm run start       # Serve build
npx tsc --noEmit    # Typecheck
npm run lint        # ESLint
```

## Migrations

Duas formas — escolher uma e ser consistente:

### Via MCP (em uso atual)

Dentro do Claude:

```
mcp__supabase__apply_migration(name="0004_xxx", query="...SQL...")
```

Migration é executada no remoto e persiste no histórico. **Sempre** salvar uma cópia em `supabase/migrations/000X_descritivo.sql` para versionamento.

### Via CLI (recomendado pra produção futura)

```bash
# autenticar uma vez
npx supabase login
npx supabase link --project-ref juyvgtgbpxxiuozeiwez

# criar nova migration
npx supabase migration new descritivo
# edita o arquivo, depois:
npx supabase db push
```

### Regenerar tipos TS depois

```bash
# via MCP
mcp__supabase__generate_typescript_types
# salvar output em src/lib/supabase/database.types.ts

# ou CLI
npx supabase gen types typescript --project-id juyvgtgbpxxiuozeiwez > src/lib/supabase/database.types.ts
```

## Edge Functions (Deno)

```bash
# criar
npx supabase functions new create-page

# servir local (precisa de Docker)
npx supabase functions serve

# deploy
npx supabase functions deploy create-page

# setar secrets
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
npx supabase secrets set MP_ACCESS_TOKEN=...
```

## Verificações de saúde

```bash
# advisors de segurança
mcp__supabase__get_advisors(type="security")

# advisors de performance
mcp__supabase__get_advisors(type="performance")

# logs de uma function
mcp__supabase__get_logs(service="edge-function")
```

## Troubleshooting

### `Missing Supabase env vars`

Falta `NEXT_PUBLIC_SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `.env.local`. Reiniciar dev server após editar `.env.local`.

### Erro `permission denied for table` em mutação no front

Esperado — front não muta direto. Mover lógica pra Edge Function.

### Slug colidiu em teste

Função `generate_unique_slug()` faz loop até unique. Se acontecer em produção alta, aumentar de 8 pra 10 chars.
