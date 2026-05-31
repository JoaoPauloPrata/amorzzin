"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  step2MessageSchema,
  type Step2Message as Values,
  type Section,
  SECTION_MAX,
  SECTION_BODY_LIMIT,
  SECTION_PRESETS,
} from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { cn } from "@/lib/utils/cn";
import { StepNav } from "../StepNav";

const LIMIT = 1500;

export function Step2Message({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft     = useWizardStore((s) => s.draft);
  const pageId    = useWizardStore((s) => s.pageId);
  const editToken = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [sections, setSections]   = useState<Section[]>(draft.sections ?? []);
  const [showPresets, setShowPresets] = useState(false);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(step2MessageSchema),
    defaultValues: { message: draft.message ?? "" },
  });

  const currentMessage = useWatch({ control, name: "message" }) ?? "";

  function syncSections(next: Section[]) {
    setSections(next);
    patchDraft({ sections: next });
  }

  function addSection(preset?: { title: string }) {
    if (sections.length >= SECTION_MAX) return;
    syncSections([...sections, { title: preset?.title ?? "", body: "" }]);
    setShowPresets(false);
  }
  function updateSection(i: number, patch: Partial<Section>) {
    syncSections(sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeSection(i: number) {
    syncSections(sections.filter((_, idx) => idx !== i));
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitErr(null);

    // remove seções totalmente vazias; trim.
    const cleaned = sections
      .map((s) => ({ title: s.title.trim(), body: s.body.trim() }))
      .filter((s) => s.title || s.body);

    patchDraft({ message: values.message, sections: cleaned });
    setSections(cleaned);

    if (!pageId || !editToken) {
      setSubmitErr("Sessão expirou. Volte ao passo 1.");
      return;
    }
    const res = await updatePage({ id: pageId, edit_token: editToken, message: values.message, sections: cleaned });
    if (!res.ok) { setSubmitErr(res.error); return; }
    onNext();
  });

  const availablePresets = SECTION_PRESETS.filter((p) => !sections.some((s) => s.title === p.title));

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Qual a mensagem?
        </h2>
        <p className="mt-2 text-ink/70">
          A mensagem principal + seções extras (opcionais) que aparecem conforme a pessoa rola a página.
        </p>
      </header>

      {/* mensagem principal */}
      <div>
        <label className="text-sm font-medium text-ink/80">Mensagem principal</label>
        <textarea
          {...register("message", { onChange: (e) => patchDraft({ message: e.target.value }) })}
          rows={6}
          maxLength={LIMIT}
          placeholder="Escreve aqui o que quer dizer pra ela…"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.message ? <p className="text-xs text-rose-600">{errors.message.message}</p> : <span />}
          <span className="text-xs text-ink/50">{currentMessage.length}/{LIMIT}</span>
        </div>
      </div>

      {/* seções extras */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink/80">Seções extras <span className="text-ink/40">(opcional)</span></label>
          <span className="text-xs text-ink/40">{sections.length}/{SECTION_MAX}</span>
        </div>

        {sections.map((sec, i) => (
          <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
            <div className="flex items-center gap-2">
              <input
                value={sec.title}
                onChange={(e) => updateSection(i, { title: e.target.value.slice(0, 60) })}
                placeholder="Título da seção (ex.: Nossa história)"
                className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-rose-400"
              />
              <button
                type="button"
                onClick={() => removeSection(i)}
                aria-label="Remover seção"
                className="flex-none rounded-lg border border-ink/10 bg-white px-2.5 py-2 text-xs font-semibold text-ink/60 transition-colors hover:text-rose-600"
              >
                ✕
              </button>
            </div>
            <textarea
              value={sec.body}
              onChange={(e) => updateSection(i, { body: e.target.value.slice(0, SECTION_BODY_LIMIT) })}
              rows={3}
              placeholder="Escreve o conteúdo dessa seção…"
              className="mt-2 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rose-400"
            />
          </div>
        ))}

        {sections.length < SECTION_MAX && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresets((v) => !v)}
              className="w-full rounded-xl border border-dashed border-rose-300 bg-white/60 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              + Adicionar seção
            </button>

            {showPresets && (
              <div className="absolute z-20 mt-2 w-full rounded-xl border border-ink/10 bg-white p-2 shadow-lg">
                {availablePresets.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => addSection(p)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-rose-50"
                  >
                    {p.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => addSection()}
                  className={cn(
                    "block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50",
                    availablePresets.length > 0 && "mt-1 border-t border-ink/5 pt-2",
                  )}
                >
                  ✏️ Seção personalizada
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <StepNav
        canBack
        isLast={false}
        submitting={isSubmitting}
        error={submitErr}
        onBack={onBack}
      />
    </form>
  );
}
