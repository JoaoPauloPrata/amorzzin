import { z } from "zod";
import { parseYouTubeUrl } from "@/lib/utils/youtube";

// Email: o `.email()` do zod aceita coisas como `a@b` (sem domínio/TLD). Exige
// formato `local@dominio.tld` com TLD de ≥2 letras.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

// Telefone BR (WhatsApp): normaliza pra dígitos, descarta DDI 55 opcional, exige
// DDD(2) + número (8 dígitos fixo ou 9 dígitos móvel) → 10 ou 11 dígitos. Rejeita
// letras e qualquer formato fora disso. Aceita máscara `() - + espaço`.
export function isValidBrPhone(raw: string): boolean {
  let d = raw.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d.length === 10 || d.length === 11;
}

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
    .max(254, "E-mail muito longo")
    .regex(EMAIL_RE, "E-mail inválido"),
  contact_phone: z
    .string()
    .trim()
    .max(20, "Máximo 20 caracteres")
    .refine(
      (v) => isValidBrPhone(v),
      "Telefone inválido — use DDD + número, ex.: (11) 98765-4321",
    )
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
  contact_email:      z.string().trim().max(254).regex(EMAIL_RE, "E-mail inválido").optional(),
  contact_phone:      z.string().trim().max(20).refine(isValidBrPhone, "Telefone inválido").optional(),
  layout_style:       z.enum(["immersive", "polaroid", "editorial", "gallery"]).optional(),
  sections:           z
                        .array(z.object({
                          title: z.string().trim().max(60),
                          body:  z.string().trim().max(1500),
                        }))
                        .max(8)
                        .optional(),
});

// Seções extras da página pública.
export type Section = { title: string; body: string };

export const SECTION_MAX = 8;
export const SECTION_BODY_LIMIT = 1500;

// Sugestões prontas (o usuário pode editar título e texto, ou criar do zero).
export const SECTION_PRESETS: { title: string; placeholder: string }[] = [
  { title: "O que mais amo em você", placeholder: "Descreve o que você mais ama nessa pessoa…" },
  { title: "Nossa história",          placeholder: "Conta um pouco de como tudo começou…" },
  { title: "Nossos sonhos",           placeholder: "O que vocês sonham viver juntos?" },
  { title: "Momento favorito",        placeholder: "Aquele momento que você nunca esquece…" },
  { title: "Por que você é especial", placeholder: "O que faz essa pessoa ser única pra você…" },
];

// Estilos de layout da página pública (espelha o check da coluna pages.layout_style).
export const LAYOUT_STYLES = ["immersive", "polaroid", "editorial", "gallery"] as const;
export type LayoutStyle = (typeof LAYOUT_STYLES)[number];

// Polaroid primeiro: é o estilo padrão do wizard/preview.
export const LAYOUT_OPTIONS: { id: LayoutStyle; nome: string; desc: string }[] = [
  { id: "polaroid",  nome: "Polaroid",  desc: "Fotos como retratos inclinados num cartão" },
  { id: "immersive", nome: "Imersivo",  desc: "Fotos preenchem a tela, texto por cima" },
  { id: "editorial", nome: "Revista",   desc: "Capa elegante, leitura em rolagem" },
  { id: "gallery",   nome: "Galeria",   desc: "Mosaico de fotos com toque pra ampliar" },
];

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
