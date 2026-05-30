# Storage Buckets

## `page-photos` (público)

| Atributo            | Valor                                                          |
| ------------------- | -------------------------------------------------------------- |
| Público             | ✅ — leitura via `/object/public/page-photos/<path>`            |
| Limite por arquivo  | 5 MB                                                           |
| MIME aceitos        | `image/jpeg`, `image/png`, `image/webp`, `image/heic`          |
| Policy `storage.objects` | nenhuma para anon (uploads via service_role)              |

**Path convention:**

```
page-photos/<page_id>/<uuid>.<ext>
```

`<uuid>` é regerado a cada upload (sem colisão por nome, sem leak de filename original).

**Por que sem SELECT policy?** Bucket marcado `public = true` libera leitura direta via URL `/object/public/...`. Adicionar SELECT policy ampla apenas habilitaria `list_objects` (advisor `public_bucket_allows_listing` flagga isso).

## `page-qrcodes` (privado)

| Atributo            | Valor                                                          |
| ------------------- | -------------------------------------------------------------- |
| Público             | ❌                                                              |
| Limite por arquivo  | 1 MB                                                           |
| MIME aceitos        | `image/png`                                                    |
| Policy              | nenhuma — apenas service_role lê/escreve                       |

**Path convention:**

```
page-qrcodes/<page_id>.png
```

Apenas 1 QR por página → sobrescreve em caso de reemissão. Acesso só via signed URL gerada na Edge `send-confirmation-email` (não é exposto ao browser diretamente).

## Operações típicas (Edge Function, Deno)

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// upload
await admin.storage
  .from("page-photos")
  .upload(`${page_id}/${crypto.randomUUID()}.jpg`, fileBytes, {
    contentType: "image/jpeg",
    upsert: false,
  });

// public URL (browser pode acessar)
const { data: { publicUrl } } = admin.storage
  .from("page-photos")
  .getPublicUrl(storagePath);

// signed URL (QR no email, 1h)
const { data: { signedUrl } } = await admin.storage
  .from("page-qrcodes")
  .createSignedUrl(`${page_id}.png`, 3600);
```

## Limpeza

- Quando `DELETE FROM pages` cascateia em `page_photos`, **objects no Storage NÃO são removidos automaticamente**. Edge `delete-photo` deve remover storage + row na mesma transação lógica.
- Cron `cleanup-drafts` (Fase 9): drafts >7d → DELETE row + DELETE objects.
