"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step3DateSchema, type Step3Date as Values } from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { StepNav } from "../StepNav";

export function Step3Date({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft     = useWizardStore((s) => s.draft);
  const pageId    = useWizardStore((s) => s.pageId);
  const editToken = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(step3DateSchema),
    defaultValues: { relationship_start: draft.relationship_start ?? "" },
  });

  const today = new Date().toISOString().split("T")[0];

  const onSubmit = handleSubmit(async (values) => {
    setSubmitErr(null);
    patchDraft(values);

    if (!pageId || !editToken) {
      setSubmitErr("Sessão expirou. Volte ao passo 1.");
      return;
    }
    const res = await updatePage({ id: pageId, edit_token: editToken, ...values });
    if (!res.ok) { setSubmitErr(res.error); return; }
    onNext();
  });

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
        <label className="text-sm font-medium text-ink/80">Data de início</label>
        <input
          {...register("relationship_start", {
            onChange: (e) => patchDraft({ relationship_start: e.target.value }),
          })}
          type="date"
          max={today}
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        {errors.relationship_start && (
          <p className="mt-1 text-xs text-rose-600">{errors.relationship_start.message}</p>
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
