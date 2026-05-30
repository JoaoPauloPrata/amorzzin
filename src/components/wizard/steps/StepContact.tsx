"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { stepContactSchema, type StepContact as Values } from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { StepNav } from "../StepNav";

export function StepContact({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft     = useWizardStore((s) => s.draft);
  const pageId    = useWizardStore((s) => s.pageId);
  const editToken = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(stepContactSchema),
    defaultValues: {
      contact_email: draft.contact_email ?? "",
      contact_phone: draft.contact_phone ?? "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitErr(null);
    patchDraft(values);

    if (!pageId || !editToken) {
      setSubmitErr("Sessão expirou. Volte ao passo 1.");
      return;
    }
    const res = await updatePage({
      id: pageId,
      edit_token: editToken,
      contact_email: values.contact_email,
      contact_phone: values.contact_phone || undefined,
    });
    if (!res.ok) { setSubmitErr(res.error); return; }
    onNext();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Pra onde mandamos o link?
        </h2>
        <p className="mt-2 text-ink/70">
          Depois do pagamento, mandamos o link da página + QR Code por e-mail.
        </p>
      </header>

      <div>
        <label className="text-sm font-medium text-ink/80">Seu e-mail</label>
        <input
          {...register("contact_email")}
          type="email"
          autoComplete="email"
          placeholder="voce@email.com"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        {errors.contact_email && (
          <p className="mt-1 text-xs text-rose-600">{errors.contact_email.message}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-ink/80">
          WhatsApp <span className="text-ink/40">(opcional)</span>
        </label>
        <input
          {...register("contact_phone")}
          type="tel"
          autoComplete="tel"
          placeholder="(11) 98765-4321"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        {errors.contact_phone && (
          <p className="mt-1 text-xs text-rose-600">{errors.contact_phone.message}</p>
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
