"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  step2MessageSchema,
  step3DateSchema,
  type Step2Message as Values,
} from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { EXAMPLE_MESSAGES, EXAMPLE_DATES } from "@/lib/wizard/examples";
import { ExampleButton } from "../ExampleButton";
import { AvatarPrompt } from "../AvatarPrompt";
import { BrDatePicker } from "../BrDatePicker";
import { StepNav } from "../StepNav";

const MSG_LIMIT = 1500;

export function StepMessage({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft      = useWizardStore((s) => s.draft);
  const pageId     = useWizardStore((s) => s.pageId);
  const editToken  = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [date, setDate]           = useState(draft.relationship_start ?? "");
  const [dateErr, setDateErr]     = useState<string | null>(null);

  const { register, handleSubmit, control, setValue, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(step2MessageSchema),
    // Vem pré-preenchido com um exemplo (a pessoa edita se quiser).
    defaultValues: { message: draft.message ?? EXAMPLE_MESSAGES[0] },
  });

  // Sincroniza o exemplo pré-preenchido com o store na 1ª visita (pra preview/save).
  useEffect(() => {
    if (draft.message === undefined) patchDraft({ message: EXAMPLE_MESSAGES[0] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentMessage = useWatch({ control, name: "message" }) ?? "";

  function applyMessage(value: string) {
    setValue("message", value, { shouldValidate: true });
    patchDraft({ message: value });
  }

  function handleDate(iso: string) {
    setDate(iso);
    setDateErr(null);
    patchDraft({ relationship_start: iso });
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitErr(null);

    const dateParsed = step3DateSchema.safeParse({ relationship_start: date });
    if (!dateParsed.success) {
      setDateErr(dateParsed.error.issues[0]?.message ?? "Data inválida");
      return;
    }

    if (!pageId || !editToken) {
      setSubmitErr("Sessão expirou. Volte ao passo 1.");
      return;
    }

    patchDraft({ message: values.message, relationship_start: date });
    const upd = await updatePage({
      id: pageId,
      edit_token: editToken,
      message: values.message,
      relationship_start: date,
    });
    if (!upd.ok) { setSubmitErr(upd.error); return; }

    onNext();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <AvatarPrompt text="Que lindo! 💕 Agora me diz uma coisa: qual mensagem você quer deixar e há quanto tempo vocês estão juntos? Pode usar um exemplo se quiser ✨" />

      {/* mensagem */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-ink/80">Mensagem principal</label>
          <ExampleButton items={EXAMPLE_MESSAGES} onPick={applyMessage} />
        </div>
        <textarea
          {...register("message", { onChange: (e) => patchDraft({ message: e.target.value }) })}
          rows={6}
          maxLength={MSG_LIMIT}
          placeholder="Escreve aqui o que quer dizer pra ela…"
          className="mt-1 w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        <div className="mt-1 flex items-center justify-between">
          {errors.message ? <p className="text-xs text-rose-600">{errors.message.message}</p> : <span />}
          <span className="text-xs text-ink/50">{currentMessage.length}/{MSG_LIMIT}</span>
        </div>
      </div>

      {/* data */}
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="relationship_start" className="text-sm font-medium text-ink/80">
            Data de início
          </label>
          <ExampleButton items={EXAMPLE_DATES} onPick={handleDate} />
        </div>
        <BrDatePicker id="relationship_start" value={date} onChange={handleDate} />
        <p className="mt-1 text-xs text-ink/50">Começa o contador de tempo que aparece na página.</p>
        {dateErr && <p className="mt-1 text-xs text-rose-600">{dateErr}</p>}
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
