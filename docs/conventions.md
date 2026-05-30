# Convenções de Código

## Estrutura de pastas

```
amorzin-v2/
├─ src/
│  ├─ app/                  # Next App Router
│  │  ├─ page.tsx           # /
│  │  ├─ criar/page.tsx     # wizard
│  │  ├─ p/[slug]/          # página pública
│  │  └─ payment/return/    # retorno do checkout
│  ├─ components/
│  │  ├─ landing/           # hero, pricing, faq
│  │  ├─ wizard/            # steps + preview
│  │  ├─ page/              # carrossel, contador, fundo animado
│  │  └─ ui/                # primitivos reusáveis
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ client.ts       # browser anon
│  │  │  ├─ server.ts       # server anon + service
│  │  │  └─ database.types.ts  # gerado, NÃO editar
│  │  ├─ wizard/            # zustand store
│  │  ├─ validators/        # zod schemas
│  │  └─ utils/             # helpers puros
│  └─ styles/               # globals.css se necessário
├─ supabase/
│  ├─ migrations/           # SQL versionado
│  └─ functions/            # Edge Deno
├─ docs/                    # esta pasta
└─ public/                  # estáticos
```

## Nomenclatura

| Item                          | Padrão                       | Exemplo                  |
| ----------------------------- | ---------------------------- | ------------------------ |
| Componente React              | PascalCase                   | `PhotoCarousel.tsx`      |
| Hook                          | camelCase + `use` prefix     | `useWizardStore.ts`      |
| Utility / helper              | camelCase                    | `formatRelativeDate.ts`  |
| Schema Zod                    | camelCase + `Schema` suffix  | `createPageSchema`       |
| Tabela / coluna Postgres      | snake_case                   | `page_photos.storage_path` |
| Edge Function                 | kebab-case                   | `create-payment-preference` |
| Migration file                | `000X_descritivo.sql`        | `0004_add_view_count.sql`|
| Env var pública               | `NEXT_PUBLIC_*`              | `NEXT_PUBLIC_SITE_URL`   |

## TypeScript

- `strict: true` (já habilitado em `tsconfig.json`).
- Sempre tipar clients: `SupabaseClient<Database>`.
- Tipos de tabela: `Tables<"pages">`, `TablesInsert<"pages">`, `TablesUpdate<"pages">`.
- Evitar `any`. Se inevitável, comentar o porquê.

## Tailwind

- Mobile-first. Default = mobile, breakpoints adicionam para desktop.
- Cores customizadas: definir em `tailwind.config.ts` (paleta romântica: rosa/lilás/dourado).
- Componentes complexos: classes via `clsx` ou `tailwind-merge` se condicional.
- Sem `@apply` em arquivos de componente (usar só em `globals.css` se for padrão de marketing repetido).

## Edge Functions

- Cada função em pasta própria: `supabase/functions/<name>/index.ts`.
- Sempre validar input com Zod no início.
- Sempre validar `edit_token` antes de mutações.
- Retornar JSON estruturado: `{ data?, error? }`.
- CORS apenas se a função é chamada do browser direto (não pelo Next server actions).

## Commits

```
feat: nova feature (escopo)
fix: bug específico
chore: build/setup
docs: apenas docs/README
refactor: sem mudança de comportamento
db: migration aplicada
```

## "Vibe coding" — boas práticas para colaboração com AI

1. **Mantenha os MDs em `docs/` atualizados.** Cada Fase concluída → atualizar `README.md` (roadmap) e o doc relevante.
2. **Migration documentada em duas partes:** arquivo SQL versionado + comentários `comment on …` no Postgres.
3. **Quando rodar advisor:** documente quais warnings são intencionais (ex: `payment_orders` RLS-enabled-no-policy).
4. **Decisões importantes vão em `architecture.md` (tabela "Decisões registradas"),** não em comentários dispersos no código.
5. **Tipos TS sempre regerados após migration.** PR de schema deve sempre incluir `database.types.ts` atualizado.
6. **Cada Edge Function tem doc em `edge-functions.md`** com: assinatura, body esperado, retornos, side-effects.
