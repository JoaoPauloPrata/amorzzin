"use client";

import { useEffect, useState } from "react";

import { useWizardStore } from "@/lib/wizard/store";
import { createPaymentPreference } from "@/app/criar/payment-actions";
import { listPlans, type PlanDTO } from "@/app/criar/plan-actions";
import { StepNav } from "../StepNav";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function fmtDuration(p: PlanDTO | null): string {
  if (!p) return "";
  if (!p.duration_days)              return "sem prazo";
  if (p.duration_days === 30)        return "30 dias";
  if (p.duration_days === 365)       return "1 ano";
  if (p.duration_days % 30 === 0)    return `${p.duration_days / 30} meses`;
  return `${p.duration_days} dias`;
}

function fmtDateBR(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function StepReview({ onBack }: { onBack: () => void }) {
  const draft     = useWizardStore((s) => s.draft);
  const photos    = useWizardStore((s) => s.photos);
  const pageId    = useWizardStore((s) => s.pageId);
  const editToken = useWizardStore((s) => s.editToken);

  const [plan, setPlan]       = useState<PlanDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying]   = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  useEffect(() => {
    if (!draft.plan_id) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const res = await listPlans();
      if (cancelled) return;
      if (res.ok) {
        setPlan(res.plans.find((p) => p.id === draft.plan_id) ?? null);
      } else {
        setErr(res.error);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [draft.plan_id]);

  const onPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!pageId || !editToken)  { setErr("Sessão expirou. Volta ao passo 1."); return; }
    if (!draft.plan_id)         { setErr("Escolhe um plano antes de pagar.");   return; }

    setPaying(true);
    const res = await createPaymentPreference({
      page_id:    pageId,
      edit_token: editToken,
      plan_id:    draft.plan_id,
    });
    if (!res.ok) {
      setErr(res.error);
      setPaying(false);
      return;
    }
    window.location.href = res.init_point;
  };

  return (
    <form onSubmit={onPay} className="space-y-6">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Tá tudo certo?
        </h2>
        <p className="mt-2 text-ink/70">
          Confere os dados e segue pro pagamento. Aceitamos cartão de crédito e Pix.
        </p>
      </header>

      <section className="space-y-3 rounded-2xl border border-ink/10 bg-white/70 p-5 backdrop-blur">
        <ReviewRow label="Pra quem"   value={draft.recipient_name || "—"} />
        <ReviewRow label="Título"     value={draft.title          || "—"} />
        <ReviewRow label="Mensagem"   value={truncate(draft.message, 120)} />
        <ReviewRow label="Início"     value={fmtDateBR(draft.relationship_start) || "—"} />
        <ReviewRow label="Fotos"      value={photos.length === 0 ? "Nenhuma" : `${photos.length} foto${photos.length === 1 ? "" : "s"}`} />
        <ReviewRow label="Música"     value={draft.music_embed_url ? "YouTube anexado" : "Sem música"} />
        <ReviewRow label="E-mail"     value={draft.contact_email || "—"} />
        {draft.contact_phone && <ReviewRow label="WhatsApp" value={draft.contact_phone} />}
      </section>

      <section className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-lilac-50 p-5">
        {loading && <p className="text-sm text-ink/60">Carregando plano…</p>}
        {!loading && plan && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-700">Plano escolhido</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{plan.display_name}</p>
              <p className="text-xs text-ink/60">Válido por {fmtDuration(plan)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink/50">Total</p>
              <p className="font-display text-3xl font-extrabold text-ink">
                {BRL.format(plan.price_cents / 100)}
              </p>
            </div>
          </div>
        )}
        {!loading && !plan && (
          <p className="text-sm text-rose-700">Plano não selecionado. Volta um passo.</p>
        )}
      </section>

      <p className="text-center text-xs text-ink/50">
        Você vai pro ambiente seguro do MercadoPago. Aceita Pix, cartão e boleto.
      </p>

      <StepNav
        canBack
        isLast
        submitting={paying}
        error={err}
        onBack={onBack}
      />
    </form>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink/5 pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-ink/50">{label}</span>
      <span className="max-w-[60%] text-right text-sm text-ink">{value}</span>
    </div>
  );
}

function truncate(s: string | undefined, max: number): string {
  if (!s) return "—";
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}
