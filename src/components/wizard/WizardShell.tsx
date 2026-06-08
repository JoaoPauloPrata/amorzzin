"use client";

import { useEffect } from "react";
import { useWizardStore } from "@/lib/wizard/store";
import { useHydrated } from "@/lib/wizard/use-hydrated";
import { StepIdentity } from "./steps/StepIdentity";
import { StepMessage }  from "./steps/StepMessage";
import { Step4Photos }  from "./steps/Step4Photos";
import { StepVisual }   from "./steps/StepVisual";
import { StepFinalize } from "./steps/StepFinalize";
import { PreviewPanel } from "./PreviewPanel";
import { PreviewMobile } from "./PreviewMobile";

const STEPS = [
  { id: "identity", label: "Identidade" },
  { id: "message",  label: "Mensagem"   },
  { id: "photos",   label: "Fotos"      },
  { id: "visual",   label: "Visual"     },
  { id: "finalize", label: "Finalizar"  },
];

export function WizardShell() {
  const hydrated = useHydrated();
  const step      = useWizardStore((s) => s.step);
  const setStep   = useWizardStore((s) => s.setStep);
  const pageId    = useWizardStore((s) => s.pageId);

  useEffect(() => {
    if (!hydrated) return;
    if (step > 0 && !pageId) setStep(0);
  }, [hydrated, pageId, step, setStep]);

  // Ao trocar de etapa, rola pro topo — garante que os campos da nova tela
  // (ex.: plano + e-mail) fiquem visíveis em vez de abrir no meio/rodapé.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center text-ink/60">Carregando…</div>
    );
  }

  const onNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const onBack = () => step > 0 && setStep(step - 1);

  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-28 md:pb-16">
      {/* seta de voltar */}
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        aria-label="Voltar"
        className="rounded-full p-1.5 text-ink/60 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="mt-4 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_320px] md:gap-14">
        <div className="space-y-3">
          {/* barra de progresso — logo acima do card, rosa sólida */}
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-rose-100"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-rose-500 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <section className="rounded-3xl border border-rose-100 bg-white/70 p-6 backdrop-blur md:p-10">
            {step === 0 && <StepIdentity onNext={onNext} />}
            {step === 1 && <StepMessage  onNext={onNext} onBack={onBack} />}
            {step === 2 && <Step4Photos  onNext={onNext} onBack={onBack} />}
            {step === 3 && <StepVisual   onNext={onNext} onBack={onBack} />}
            {step === 4 && <StepFinalize                 onBack={onBack} />}
          </section>
        </div>

        <PreviewPanel />
      </div>

      <PreviewMobile />
    </div>
  );
}
