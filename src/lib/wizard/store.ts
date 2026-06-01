"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type WizardDraft = {
  recipient_name?:     string;
  title?:              string;
  message?:            string;
  relationship_start?: string;
  music_embed_url?:    string | null;
  music_provider?:     "youtube" | "spotify" | null;
  plan_id?:            string;
  contact_email?:      string;
  contact_phone?:      string;
  layout_style?:       "immersive" | "polaroid" | "editorial" | "gallery";
  sections?:           { title: string; body: string }[];
};

export type WizardPhoto = {
  id:       string;
  position: number;
  url:      string;
};

type WizardState = {
  pageId:     string | null;
  editToken:  string | null;
  slug:       string | null;
  step:       number;
  maxStep:    number;
  draft:      WizardDraft;
  photos:     WizardPhoto[];

  setPage:    (id: string, editToken: string, slug: string) => void;
  setStep:    (step: number) => void;
  patchDraft: (patch: Partial<WizardDraft>) => void;
  setPhotos:  (photos: WizardPhoto[]) => void;
  reset:      () => void;
};

const INITIAL: Pick<WizardState, "pageId" | "editToken" | "slug" | "step" | "maxStep" | "draft" | "photos"> = {
  pageId:    null,
  editToken: null,
  slug:      null,
  step:      0,
  maxStep:   0,
  draft:     {},
  photos:    [],
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      ...INITIAL,
      setPage: (id, editToken, slug) =>
        set({ pageId: id, editToken, slug }),
      // maxStep só sobe — registra o passo mais distante já alcançado (validado via
      // submit de cada etapa). É o que libera clique direto no stepper sem deixar
      // pular pra etapas ainda não preenchidas.
      setStep: (step) => set((s) => ({ step, maxStep: Math.max(s.maxStep, step) })),
      patchDraft: (patch) =>
        set((s) => ({ draft: { ...s.draft, ...patch } })),
      setPhotos: (photos) => set({ photos }),
      reset: () => set({ ...INITIAL }),
    }),
    {
      name: "amorzin-wizard",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
