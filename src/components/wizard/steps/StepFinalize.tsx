"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { stepContactSchema, type StepContact as ContactValues } from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { listPlans, type PlanDTO } from "@/app/criar/plan-actions";
import { createPaymentPreference } from "@/app/criar/payment-actions";
import { fbqTrack } from "@/lib/meta-pixel";
import { cn } from "@/lib/utils/cn";
import { StepNav } from "../StepNav";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function fmtDuration(p: PlanDTO | null): string {
  if (!p) return "";
  if (!p.duration_days)           return "sem prazo";
  if (p.duration_days === 30)     return "30 dias";
  if (p.duration_days === 365)    return "1 ano";
  if (p.duration_days % 30 === 0) return `${p.duration_days / 30} meses`;
  return `${p.duration_days} dias`;
}

function fmtDateBR(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function truncate(s: string | undefined, max: number): string {
  if (!s) return "—";
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

export function StepFinalize({ onBack }: { onBack: () => void }) {
  const draft      = useWizardStore((s) => s.draft);
  const photos     = useWizardStore((s) => s.photos);
  const pageId     = useWizardStore((s) => s.pageId);
  const editToken  = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [plans, setPlans]       = useState<PlanDTO[]>([]);
  const [selected, setSelected] = useState<string | null>(draft.plan_id ?? null);
  const [loading, setLoading]   = useState(true);
  const [paying, setPaying]     = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ContactValues>({
    resolver: zodResolver(stepContactSchema),
    defaultValues: {
      contact_email: draft.contact_email ?? "",
      contact_phone: draft.contact_phone ?? "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await listPlans();
      if (cancelled) return;
      if (res.ok) {
        setPlans(res.plans);
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

  const highest = plans.length > 0
    ? [...plans].sort((a, b) => b.price_cents - a.price_cents)[0]?.id
    : null;
  const selectedPlan = plans.find((p) => p.id === selected) ?? null;

  const onSubmit = handleSubmit(async (values) => {
    setErr(null);
    if (!pageId || !editToken) { setErr("Sessão expirou. Volta ao passo 1."); return; }
    if (!selected)             { setErr("Escolhe um plano antes de pagar.");  return; }

    setPaying(true);
    patchDraft({ ...values, plan_id: selected });

    const upd = await updatePage({
      id: pageId,
      edit_token: editToken,
      contact_email: values.contact_email,
      contact_phone: values.contact_phone || undefined,
      plan_id: selected,
    });
    if (!upd.ok) { setErr(upd.error); setPaying(false); return; }

    const res = await createPaymentPreference({
      page_id:    pageId,
      edit_token: editToken,
      plan_id:    selected,
    });
    if (!res.ok) { setErr(res.error); setPaying(false); return; }

    fbqTrack("InitiateCheckout", {
      value:        selectedPlan ? selectedPlan.price_cents / 100 : undefined,
      currency:     "BRL",
      content_ids:  [selected],
      content_type: "product",
    });

    window.location.href = res.init_point;
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Quase lá
        </h2>
        <p className="mt-2 text-ink/70">
          Confere os dados, escolhe o plano e segue pro pagamento. Aceitamos Pix e cartão.
        </p>
      </header>

      {/* ── Contato ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink/50">Pra onde mandamos o link</h3>
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
      </section>

      {/* ── Plano ── */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink/50">Plano</h3>
        {loading && <p className="text-sm text-ink/60">Carregando planos…</p>}
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
                      isSelected ? "border-rose-500 shadow-soft" : "border-ink/10 hover:border-rose-300",
                    )}
                  >
                    {isTop && (
                      <span className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-soft">
                        Recomendado
                      </span>
                    )}
                    <div className="flex items-baseline justify-between">
                      <h4 className="font-display text-xl font-bold text-ink">{p.display_name}</h4>
                      <span className={cn(
                        "grid h-5 w-5 place-items-center rounded-full border-2 transition-colors",
                        isSelected ? "border-rose-500 bg-rose-500" : "border-ink/20",
                      )}>
                        {isSelected && <span className="block h-2 w-2 rounded-full bg-white" />}
                      </span>
                    </div>
                    <div>
                      <p className="text-3xl font-extrabold text-ink">{BRL.format(p.price_cents / 100)}</p>
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
      </section>

      {/* ── Revisão ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink/50">Revisão</h3>
        <div className="space-y-3 rounded-2xl border border-ink/10 bg-white/70 p-5 backdrop-blur">
          <ReviewRow label="Pra quem" value={draft.recipient_name || "—"} />
          <ReviewRow label="Título"   value={draft.title || "—"} />
          <ReviewRow label="Mensagem" value={truncate(draft.message, 120)} />
          <ReviewRow label="Início"   value={fmtDateBR(draft.relationship_start) || "—"} />
          <ReviewRow label="Fotos"    value={photos.length === 0 ? "Nenhuma" : `${photos.length} foto${photos.length === 1 ? "" : "s"}`} />
          <ReviewRow label="Música"   value={draft.music_embed_url ? "YouTube anexado" : "Sem música"} />
        </div>

        <div className="rounded-2xl border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-lilac-50 p-5">
          {selectedPlan ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-rose-700">Plano escolhido</p>
                <p className="mt-1 font-display text-2xl font-bold text-ink">{selectedPlan.display_name}</p>
                <p className="text-xs text-ink/60">Válido por {fmtDuration(selectedPlan)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink/50">Total</p>
                <p className="font-display text-3xl font-extrabold text-ink">{BRL.format(selectedPlan.price_cents / 100)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-rose-700">Escolhe um plano acima.</p>
          )}
        </div>
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
