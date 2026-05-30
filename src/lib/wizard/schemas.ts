import { z } from "zod";
import { parseYouTubeUrl } from "@/lib/utils/youtube";

export const step1TitleSchema = z.object({
  recipient_name: z
    .string()
    .trim()
    .min(1, "Diz pra quem é essa página")
    .max(60, "Máximo 60 caracteres"),
  title: z
    .string()
    .trim()
    .min(1, "Escolhe um título curtinho")
    .max(80, "Máximo 80 caracteres"),
});

export const step2MessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Escreve pelo menos 10 caracteres")
    .max(1500, "Máximo 1500 caracteres"),
});

export const step3DateSchema = z.object({
  relationship_start: z
    .string()
    .min(1, "Escolhe uma data")
    .refine((v) => {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return false;
      return d.getTime() <= Date.now();
    }, "Data tem que ser hoje ou no passado"),
});

// Step 5 — Música (YouTube). Tudo opcional: passo é skippable.
// Aceita: string vazia (sem música) ou URL válida do YouTube.
export const stepMusicSchema = z.object({
  music_url: z
    .string()
    .trim()
    .max(200, "URL muito longa")
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || parseYouTubeUrl(v) !== null, "Link do YouTube inválido"),
});

export const stepContactSchema = z.object({
  contact_email: z
    .string()
    .trim()
    .min(1, "E-mail obrigatório — é por onde mandamos o link")
    .email("E-mail inválido"),
  contact_phone: z
    .string()
    .trim()
    .max(20, "Máximo 20 caracteres")
    .optional()
    .or(z.literal("")),
});

export type Step1Title    = z.infer<typeof step1TitleSchema>;
export type Step2Message  = z.infer<typeof step2MessageSchema>;
export type Step3Date     = z.infer<typeof step3DateSchema>;
export type StepMusic     = z.infer<typeof stepMusicSchema>;
export type StepContact   = z.infer<typeof stepContactSchema>;

export const createPagePayloadSchema = z.object({
  recipient_name:     z.string().trim().min(1).max(60).optional(),
  title:              z.string().trim().min(1).max(80).optional(),
});

export const updatePagePayloadSchema = z.object({
  id:                 z.string().uuid(),
  edit_token:         z.string().uuid(),
  recipient_name:     z.string().trim().min(1).max(60).optional(),
  title:              z.string().trim().min(1).max(80).optional(),
  message:            z.string().trim().min(1).max(1500).optional(),
  relationship_start: z.string().min(1).optional(),
  // music: nullable em ambos pra permitir "remover música". Provider derivado.
  music_embed_url:    z.string().url().max(300).nullable().optional(),
  music_provider:     z.enum(["youtube", "spotify"]).nullable().optional(),
  // plan_id: setado pelo Step Plan. Validado contra DB no createPaymentPreference.
  plan_id:            z.string().min(1).max(40).optional(),
  contact_email:      z.string().trim().email().optional(),
  contact_phone:      z.string().trim().max(20).optional(),
});

export type CreatePagePayload = z.infer<typeof createPagePayloadSchema>;
export type UpdatePagePayload = z.infer<typeof updatePagePayloadSchema>;

// ─── Photos ─────────────────────────────────────────────────────────────────

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB — espelha o bucket
export const PHOTO_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;
export type PhotoMime = (typeof PHOTO_ALLOWED_MIME)[number];

// Fallback usado enquanto plan_id é NULL no rascunho.
// Igual ao max_photos do annual (plano mais alto) — usuário não fica preso.
export const PHOTO_FALLBACK_MAX = 8;

export const photoIdentitySchema = z.object({
  page_id:    z.string().uuid(),
  edit_token: z.string().uuid(),
});

export const reorderPhotosPayloadSchema = z.object({
  page_id:     z.string().uuid(),
  edit_token:  z.string().uuid(),
  ordered_ids: z.array(z.string().uuid()).min(1),
});

export const deletePhotoPayloadSchema = z.object({
  page_id:    z.string().uuid(),
  edit_token: z.string().uuid(),
  photo_id:   z.string().uuid(),
});

export type PhotoIdentity        = z.infer<typeof photoIdentitySchema>;
export type ReorderPhotosPayload = z.infer<typeof reorderPhotosPayloadSchema>;
export type DeletePhotoPayload   = z.infer<typeof deletePhotoPayloadSchema>;
