"use client";

import { cn } from "@/lib/utils/cn";

type Props = {
  canBack:    boolean;
  isLast:     boolean;
  submitting: boolean;
  error?:     string | null;
  onBack:     () => void;
};

export function StepNav({ canBack, isLast, submitting, error, onBack }: Props) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={!canBack || submitting}
          className={cn(
            "rounded-full border border-ink/15 bg-cream px-5 py-2.5 text-sm font-semibold text-ink transition-colors",
            (!canBack || submitting) && "cursor-not-allowed opacity-40",
          )}
        >
          Voltar
        </button>

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform",
            submitting ? "opacity-70" : "hover:scale-[1.03]",
          )}
        >
          {submitting ? "Salvando…" : isLast ? "Ir pra pagamento" : "Continuar"}
          {!submitting && <span>›</span>}
        </button>
      </div>
    </div>
  );
}
