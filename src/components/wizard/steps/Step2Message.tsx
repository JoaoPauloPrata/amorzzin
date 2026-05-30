"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step2MessageSchema, type Step2Message as Values } from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { StepNav } from "../StepNav";

const LIMIT = 1500;

export function Step2Message({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft     = useWizardStore((s) => s.draft);
  const pageId    = useWizardStore((s) => s.pageId);
  const editToken = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(step2MessageSchema),
    defaultValues: { message: draft.message ?? "" },
  });

  const currentMessage = useWatch({ control, name: "message" }) ?? "";

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
          Qual a mensagem?
        </h2>
        <p className="mt-2 text-ink/70">
          Escreve com calma. Pode ser uma carta, uma declaração ou só "te amo, sua chata".
        </p>
      </header>

      <div>
        <textarea
          {...register("message", {
            onChange: (e) => patchDraft({ message: e.target.value }),
          })}
          rows={8}
          maxLength={LIMIT}
          placeholder="Escreve aqui o que quer dizer pra ela…"
          className="w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.message ? (
            <p className="text-xs text-rose-600">{errors.message.message}</p>
          ) : <span />}
          <span className="text-xs text-ink/50">
            {currentMessage.length}/{LIMIT}
          </span>
        </div>
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
