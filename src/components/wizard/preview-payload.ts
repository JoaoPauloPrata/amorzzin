import type { WizardDraft, WizardPhoto } from "@/lib/wizard/store";

// Foto de exemplo exibida no preview Polaroid enquanto o usuário não subiu as dele.
// Some assim que a primeira foto real entra (photos.length > 0).
export const PREVIEW_PLACEHOLDER_PHOTO = "/preview-placeholder.png";

// Monta o payload enviado ao iframe de preview (/embed/preview). Mesmo formato de
// LayoutProps. Usado pelo preview desktop (PreviewPanel) e mobile (PreviewMobile).
export function buildPreviewPayload(draft: WizardDraft, photos: WizardPhoto[]) {
  const style     = draft.layout_style ?? "polaroid";
  const photoUrls = photos.map((p) => p.url);
  return {
    style,
    title:             draft.title?.trim()          || "Seu título aparece aqui",
    recipient:         draft.recipient_name?.trim() || null,
    message:           draft.message?.trim()        || "Sua mensagem aparece aqui assim que você digitar…",
    relationshipStart: draft.relationship_start     || null,
    photos:            photoUrls.length === 0 && style === "polaroid"
                         ? [PREVIEW_PLACEHOLDER_PHOTO]
                         : photoUrls,
    sections:          (draft.sections ?? []).filter((s) => s.title?.trim() || s.body?.trim()),
    emoji:             "❤️",
  };
}
