"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1TitleSchema, type Step1Title as Values } from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { createPage, updatePage } from "@/app/criar/actions";
import { EXAMPLE_RECIPIENT_NAMES, EXAMPLE_TITLES } from "@/lib/wizard/examples";
import { ExampleButton } from "../ExampleButton";
import { AvatarPrompt } from "../AvatarPrompt";
import { StepNav } from "../StepNav";

export function StepIdentity({ onNext }: { onNext: () => void }) {
  const draft      = useWizardStore((s) => s.draft);
  const pageId     = useWizardStore((s) => s.pageId);
  const editToken  = useWizardStore((s) => s.editToken);
  const setPage    = useWizardStore((s) => s.setPage);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(step1TitleSchema),
    defaultValues: {
      recipient_name: draft.recipient_name ?? "",
      title:          draft.title ?? "",
    },
  });

  function applyExample(field: keyof Values, value: string) {
    setValue(field, value as Values[keyof Values], { shouldValidate: true });
    patchDraft({ [field]: value });
  }

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
    <form onSubmit={onSubmit} className="space-y-6">
      <AvatarPrompt text="Oi! Eu sou o Cupido 💘 Pra começar a criar esse presente especial, me conta: pra quem é a página e qual título você quer dar? Sem ideia? É só tocar em Usar exemplo 😉" />

      {/* nome */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink/80">Nome de quem vai receber</label>
          <ExampleButton items={EXAMPLE_RECIPIENT_NAMES} onPick={(v) => applyExample("recipient_name", v)} />
        </div>
        <input
          {...register("recipient_name", { onChange: (e) => patchDraft({ recipient_name: e.target.value }) })}
          placeholder="Ex: Joana"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        {errors.recipient_name && (
          <p className="mt-1 text-xs text-rose-600">{errors.recipient_name.message}</p>
        )}
      </div>

      {/* título */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink/80">Título da página</label>
          <ExampleButton items={EXAMPLE_TITLES} onPick={(v) => applyExample("title", v)} />
        </div>
        <input
          {...register("title", { onChange: (e) => patchDraft({ title: e.target.value }) })}
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
