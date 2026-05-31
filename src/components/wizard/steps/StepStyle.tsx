"use client";

import { useState } from "react";
import { LAYOUT_OPTIONS, type LayoutStyle } from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { cn } from "@/lib/utils/cn";
import { StepNav } from "../StepNav";

// Mini-mock visual de cada layout (puro CSS, só pra dar ideia).
function Thumb({ id, active }: { id: LayoutStyle; active: boolean }) {
  const base = "relative h-24 w-full overflow-hidden rounded-lg border";
  const ring = active ? "border-rose-400" : "border-ink/10";

  if (id === "immersive") {
    return (
      <div className={cn(base, ring, "bg-gradient-to-b from-rose-400 to-lilac-500")}>
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1">
          <span className="h-2 w-16 rounded bg-white/90" />
          <span className="h-1.5 w-20 rounded bg-white/60" />
        </div>
      </div>
    );
  }
  if (id === "polaroid") {
    return (
      <div className={cn(base, ring, "bg-rose-50")}>
        <div className="absolute left-1/2 top-4 h-12 w-14 -translate-x-1/2 -rotate-6 rounded-sm border border-ink/10 bg-white shadow-sm" />
        <div className="absolute left-1/2 top-3 h-12 w-14 -translate-x-1/2 rotate-3 rounded-sm border border-ink/10 bg-white shadow" />
        <div className="absolute inset-x-0 bottom-2 flex justify-center"><span className="h-1.5 w-16 rounded bg-rose-300" /></div>
      </div>
    );
  }
  if (id === "editorial") {
    return (
      <div className={cn(base, ring, "bg-[#fbf6ef]")}>
        <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-b from-rose-300 to-lilac-300" />
        <div className="absolute right-2 top-3 flex flex-col gap-1">
          <span className="h-2 w-12 rounded-sm bg-ink/70" />
          <span className="h-1 w-14 rounded bg-ink/30" />
          <span className="h-1 w-10 rounded bg-ink/30" />
          <span className="mt-1 h-1 w-12 rounded bg-ink/20" />
        </div>
      </div>
    );
  }
  // gallery
  return (
    <div className={cn(base, ring, "bg-white p-2")}>
      <div className="grid h-full grid-cols-3 grid-rows-2 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="rounded-sm bg-gradient-to-br from-rose-200 to-lilac-200" />
        ))}
      </div>
    </div>
  );
}

export function StepStyle({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft      = useWizardStore((s) => s.draft);
  const pageId     = useWizardStore((s) => s.pageId);
  const editToken  = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [selected, setSelected] = useState<LayoutStyle>(draft.layout_style ?? "immersive");
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function choose(id: LayoutStyle) {
    setSelected(id);
    patchDraft({ layout_style: id });
    if (pageId && editToken) {
      await updatePage({ id: pageId, edit_token: editToken, layout_style: id });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    if (!pageId || !editToken) { setSubmitErr("Sessão expirou. Volte ao passo 1."); return; }
    setSaving(true);
    const res = await updatePage({ id: pageId, edit_token: editToken, layout_style: selected });
    setSaving(false);
    if (!res.ok) { setSubmitErr(res.error); return; }
    patchDraft({ layout_style: selected });
    onNext();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Escolha o estilo
        </h2>
        <p className="mt-2 text-ink/70">
          Como sua página vai se apresentar. Dá pra trocar quando quiser, antes de pagar.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LAYOUT_OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => choose(opt.id)}
              className={cn(
                "rounded-2xl border p-3 text-left transition-all",
                active
                  ? "border-rose-400 bg-rose-50/60 shadow-soft ring-1 ring-rose-300"
                  : "border-ink/10 bg-white/70 hover:border-rose-200",
              )}
            >
              <Thumb id={opt.id} active={active} />
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold text-ink">{opt.nome}</span>
                {active && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 text-[11px] text-white">✓</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-ink/60">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      <StepNav
        canBack
        isLast={false}
        submitting={saving}
        error={submitErr}
        onBack={onBack}
      />
    </form>
  );
}
