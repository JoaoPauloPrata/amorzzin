"use client";

import { useEffect } from "react";
import { useWizardStore } from "@/lib/wizard/store";
import { useHydrated } from "@/lib/wizard/use-hydrated";
import { cn } from "@/lib/utils/cn";
import { Step1Title }   from "./steps/Step1Title";
import { Step2Message } from "./steps/Step2Message";
import { Step3Date }    from "./steps/Step3Date";
import { Step4Photos }  from "./steps/Step4Photos";
import { StepStyle }    from "./steps/StepStyle";
import { Step5Music }   from "./steps/Step5Music";
import { StepContact }  from "./steps/StepContact";
import { StepPlan }     from "./steps/StepPlan";
import { StepReview }   from "./steps/StepReview";
import { PreviewPanel } from "./PreviewPanel";
import { PreviewMobile } from "./PreviewMobile";

const STEPS = [
  { id: "title",   label: "Pra quem"  },
  { id: "message", label: "Mensagem"  },
  { id: "date",    label: "Data"      },
  { id: "photos",  label: "Fotos"     },
  { id: "style",   label: "Estilo"    },
  { id: "music",   label: "Música"    },
  { id: "contact", label: "Contato"   },
  { id: "plan",    label: "Plano"     },
  { id: "review",  label: "Revisar"   },
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

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-16 text-center text-ink/60">Carregando…</div>
    );
  }

  const onNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };
  const onBack = () => step > 0 && setStep(step - 1);

  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-28 md:pb-16">
      <ProgressBar current={step} />

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_320px] md:gap-14">
        <section className="rounded-3xl border border-rose-100 bg-white/70 p-6 backdrop-blur md:p-10">
          {step === 0 && <Step1Title   onNext={onNext} />}
          {step === 1 && <Step2Message onNext={onNext} onBack={onBack} />}
          {step === 2 && <Step3Date    onNext={onNext} onBack={onBack} />}
          {step === 3 && <Step4Photos  onNext={onNext} onBack={onBack} />}
          {step === 4 && <StepStyle    onNext={onNext} onBack={onBack} />}
          {step === 5 && <Step5Music   onNext={onNext} onBack={onBack} />}
          {step === 6 && <StepContact  onNext={onNext} onBack={onBack} />}
          {step === 7 && <StepPlan     onNext={onNext} onBack={onBack} />}
          {step === 8 && <StepReview                   onBack={onBack} />}
        </section>

        <PreviewPanel />
      </div>

      <PreviewMobile />
    </div>
  );
}

function ProgressBar({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 md:gap-3">
      {STEPS.map((s, i) => {
        const isActive = i === current;
        const isDone   = i <  current;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors",
                isActive && "bg-gradient-to-r from-rose-500 to-lilac-500 text-white shadow-soft",
                isDone   && "bg-rose-100 text-rose-600",
                !isActive && !isDone && "bg-ink/10 text-ink/50",
              )}
            >
              {isDone ? "✓" : i + 1}
            </span>
            <span className={cn(
              "hidden text-sm font-medium md:inline",
              isActive ? "text-ink" : "text-ink/50",
            )}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="hidden h-px w-4 bg-ink/15 md:block" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
