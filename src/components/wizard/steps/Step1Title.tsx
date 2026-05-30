"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1TitleSchema, type Step1Title as Values } from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { createPage, updatePage } from "@/app/criar/actions";
import { StepNav } from "../StepNav";

export function Step1Title({ onNext }: { onNext: () => void }) {
  const draft     = useWizardStore((s) => s.draft);
  const pageId    = useWizardStore((s) => s.pageId);
  const editToken = useWizardStore((s) => s.editToken);
  const setPage   = useWizardStore((s) => s.setPage);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(step1TitleSchema),
    defaultValues: {
      recipient_name: draft.recipient_name ?? "",
      title:          draft.title ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitErr(null);
    patchDraft(values);

    if (!pageId || !editToken) {
      const res = await createPage(values);
      if (!res.ok) { setSubmitErr(res.error); return; }
      setPage(res.id, res.edit_token, res.slug);
    } else {
      const res = await updatePage({ id: pageId, edit_token: editToken, ...values });
      if (!res.ok) { setSubmitErr(res.error); return; }
    }

    onNext();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Pra quem é essa página?
        </h2>
        <p className="mt-2 text-ink/70">
          Comece com o nome de quem vai receber e um título curtinho.
        </p>
      </header>

      <div>
        <label className="text-sm font-medium text-ink/80">Nome de quem vai receber</label>
        <input
          {...register("recipient_name")}
          placeholder="Ex: Joana"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        {errors.recipient_name && (
          <p className="mt-1 text-xs text-rose-600">{errors.recipient_name.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-ink/80">Título da página</label>
        <input
          {...register("title")}
          placeholder="Ex: Pra minha Joana"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        {errors.title && (
          <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>
        )}
      </div>

      <StepNav
        canBack={false}
        isLast={false}
        submitting={isSubmitting}
        error={submitErr}
        onBack={() => {}}
      />
    </form>
  );
}
