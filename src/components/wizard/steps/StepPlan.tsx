"use client";

import { useEffect, useState } from "react";

import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { listPlans, type PlanDTO } from "@/app/criar/plan-actions";
import { cn } from "@/lib/utils/cn";
import { StepNav } from "../StepNav";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function fmtDuration(p: PlanDTO): string {
  if (!p.duration_days) return "sem prazo";
  if (p.duration_days === 30)  return "30 dias";
  if (p.duration_days === 365) return "1 ano";
  if (p.duration_days < 30)    return `${p.duration_days} dias`;
  if (p.duration_days % 30 === 0) return `${p.duration_days / 30} meses`;
  return `${p.duration_days} dias`;
}

export function StepPlan({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft      = useWizardStore((s) => s.draft);
  const pageId     = useWizardStore((s) => s.pageId);
  const editToken  = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [plans, setPlans]     = useState<PlanDTO[]>([]);
  const [selected, setSelected] = useState<string | null>(draft.plan_id ?? null);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState<string | null>(null);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listPlans();
      if (cancelled) return;
      if (res.ok) {
        setPlans(res.plans);
        // Pré-seleciona o annual (maior preço) caso usuário não tenha escolhido.
        if (!selected && res.plans.length > 0) {
          const top = [...res.plans].sort((a, b) => b.price_cents - a.price_cents)[0];
          setSelected(top.id);
        }
      } else {
        setErr(res.error);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { setErr("Escolhe um plano."); return; }
    if (!pageId || !editToken) { setErr("Sessão expirou. Volta ao passo 1."); return; }

    setSaving(true);
    setErr(null);
    const res = await updatePage({
      id: pageId,
      edit_token: editToken,
      plan_id: selected,
    });
    setSaving(false);
    if (!res.ok) { setErr(res.error); return; }
    patchDraft({ plan_id: selected });
    onNext();
  };

  const highest = plans.length > 0
    ? [...plans].sort((a, b) => b.price_cents - a.price_cents)[0]?.id
    : null;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Qual plano combina com você?
        </h2>
        <p className="mt-2 text-ink/70">
          Você só paga uma vez. A página fica online pelo período do plano.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-ink/60">Carregando planos…</p>
      )}

      {!loading && plans.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((p) => {
            const isSelected = selected === p.id;
            const isTop      = p.id === highest;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "group relative flex w-full flex-col gap-3 rounded-2xl border-2 bg-white/70 p-5 text-left backdrop-blur transition-all",
                    isSelected
                      ? "border-rose-500 shadow-soft"
                      : "border-ink/10 hover:border-rose-300",
                  )}
                >
                  {isTop && (
                    <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-soft">
                      Recomendado
                    </span>
                  )}

                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-xl font-bold text-ink">{p.display_name}</h3>
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full border-2 transition-colors",
                        isSelected ? "border-rose-500 bg-rose-500" : "border-ink/20",
                      )}
                    >
                      {isSelected && <span className="block h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </div>

                  <div>
                    <p className="text-3xl font-extrabold text-ink">
                      {BRL.format(p.price_cents / 100)}
                    </p>
                    <p className="text-xs text-ink/50">pagamento único — vale por {fmtDuration(p)}</p>
                  </div>

                  <ul className="mt-1 space-y-1 text-sm text-ink/70">
                    <li>• Até {p.max_photos} fotos no carrossel</li>
                    <li>• Mensagem com até {p.max_message_length} caracteres</li>
                    <li>• Música do YouTube de fundo</li>
                    <li>• QR Code + link público</li>
                  </ul>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <StepNav
        canBack
        isLast={false}
        submitting={saving}
        error={err}
        onBack={onBack}
      />
    </form>
  );
}
