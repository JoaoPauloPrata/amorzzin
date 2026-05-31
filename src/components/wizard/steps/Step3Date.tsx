"use client";

import { useState } from "react";
import { step3DateSchema } from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { StepNav } from "../StepNav";
import { BrDatePicker } from "../BrDatePicker";

export function Step3Date({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft     = useWizardStore((s) => s.draft);
  const pageId    = useWizardStore((s) => s.pageId);
  const editToken = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [value, setValue]       = useState(draft.relationship_start ?? "");
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(iso: string) {
    setValue(iso);
    setError(null);
    patchDraft({ relationship_start: iso });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = step3DateSchema.safeParse({ relationship_start: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data inválida");
      return;
    }

    if (!pageId || !editToken) {
      setError("Sessão expirou. Volte ao passo 1.");
      return;
    }

    setSubmitting(true);
    patchDraft({ relationship_start: value });
    const res = await updatePage({ id: pageId, edit_token: editToken, relationship_start: value });
    setSubmitting(false);
    if (!res.ok) { setError(res.error); return; }
    onNext();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Quando começou?
        </h2>
        <p className="mt-2 text-ink/70">
          A data do início — começa o contador de tempo que aparece na página.
        </p>
      </header>

      <div>
        <label htmlFor="relationship_start" className="text-sm font-medium text-ink/80">
          Data de início
        </label>
        <BrDatePicker id="relationship_start" value={value} onChange={handleChange} />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>

      <StepNav
        canBack
        isLast={false}
        submitting={submitting}
        error={null}
        onBack={onBack}
      />
    </form>
  );
}
