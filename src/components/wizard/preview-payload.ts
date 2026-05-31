import type { WizardDraft, WizardPhoto } from "@/lib/wizard/store";

// Monta o payload enviado ao iframe de preview (/embed/preview). Mesmo formato de
// LayoutProps. Usado pelo preview desktop (PreviewPanel) e mobile (PreviewMobile).
export function buildPreviewPayload(draft: WizardDraft, photos: WizardPhoto[]) {
  return {
    style:             draft.layout_style ?? "immersive",
    title:             draft.title?.trim()          || "Seu título aparece aqui",
    recipient:         draft.recipient_name?.trim() || null,
    message:           draft.message?.trim()        || "Sua mensagem aparece aqui assim que você digitar…",
    relationshipStart: draft.relationship_start     || null,
    photos:            photos.map((p) => p.url),
    sections:          (draft.sections ?? []).filter((s) => s.title?.trim() || s.body?.trim()),
    emoji:             "❤️",
  };
}
