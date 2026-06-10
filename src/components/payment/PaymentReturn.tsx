"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useWizardStore } from "@/lib/wizard/store";
import { useHydrated } from "@/lib/wizard/use-hydrated";
import { getPaymentOrderStatus, type PaymentOrderStatus } from "@/app/criar/payment-actions";
import { fbqTrack } from "@/lib/meta-pixel";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS  = 60_000;

/**
 * Dispara o evento Purchase do Meta Pixel uma única vez por página paga.
 * Guarda flag no localStorage (reload da página de retorno re-poll e cairia
 * aqui de novo) e usa o page_id como eventID pra dedup no lado do Meta.
 */
function trackPurchaseOnce(pageId: string, amountCents: number | null, planId: string | null) {
  const key = `amorzin_fbq_purchase_${pageId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    // localStorage indisponível (modo privado etc.) — segue com dedup só por eventID
  }
  fbqTrack(
    "Purchase",
    {
      value:        amountCents != null ? amountCents / 100 : undefined,
      currency:     "BRL",
      content_ids:  planId ? [planId] : undefined,
      content_type: "product",
    },
    pageId,
  );
}

type UIState =
  | { kind: "hydrating" }
  | { kind: "no-session" }
  | { kind: "polling"; attempts: number; secondsLeft: number }
  | { kind: "approved"; slug: string }
  | { kind: "rejected"; reason: string }
  | { kind: "pending"; }
  | { kind: "error"; reason: string };

export function PaymentReturn({
  pageId,
  mpStatus,
  mpPaymentId,
}: {
  pageId?:      string;
  mpStatus?:    string;
  mpPaymentId?: string;
}) {
  const hydrated  = useHydrated();
  const editToken = useWizardStore((s) => s.editToken);
  const slugInStore = useWizardStore((s) => s.slug);

  const [state, setState] = useState<UIState>({ kind: "hydrating" });

  useEffect(() => {
    if (!hydrated) return;
    if (!pageId || !editToken) {
      setState({ kind: "no-session" });
      return;
    }

    let cancelled = false;
    let attempts  = 0;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;
      const elapsed = Date.now() - startedAt;
      if (elapsed >= POLL_TIMEOUT_MS) {
        setState({ kind: "pending" });
        return;
      }
      attempts++;
      setState({
        kind:        "polling",
        attempts,
        secondsLeft: Math.max(0, Math.ceil((POLL_TIMEOUT_MS - elapsed) / 1000)),
      });

      const res = await getPaymentOrderStatus({ page_id: pageId, edit_token: editToken });
      if (cancelled) return;

      if (!res.ok) {
        setState({ kind: "error", reason: res.error });
        return;
      }

      if (res.status === "approved" || res.page_status === "active") {
        trackPurchaseOnce(pageId, res.amount_cents, res.plan_id);
        setState({ kind: "approved", slug: res.slug });
        return;
      }
      if (res.status === "rejected" || res.status === "cancelled") {
        setState({ kind: "rejected", reason: `Pagamento ${res.status === "rejected" ? "recusado" : "cancelado"}.` });
        return;
      }

      setTimeout(tick, POLL_INTERVAL_MS);
    };

    // se MP já redirecionou com status=failure dá pra encurtar:
    if (mpStatus === "failure") {
      setState({ kind: "rejected", reason: "Pagamento recusado pelo MercadoPago." });
      return;
    }

    tick();
    return () => { cancelled = true; };
  }, [hydrated, pageId, editToken, mpStatus]);

  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-16 text-center">
      {state.kind === "hydrating" && <p className="text-ink/60">Carregando…</p>}

      {state.kind === "no-session" && (
        <Card title="Não encontrei seu rascunho" tone="warn">
          <p>
            Sessão do navegador expirou ou esse link foi aberto em outro dispositivo. Se você
            pagou, vamos enviar o link da página pro e-mail cadastrado em alguns minutos.
          </p>
          <Link href="/criar" className="mt-6 inline-block rounded-full border border-ink/15 bg-cream px-5 py-2.5 text-sm font-semibold text-ink">
            Voltar pro início
          </Link>
        </Card>
      )}

      {state.kind === "polling" && (
        <Card title="Confirmando pagamento" tone="ok">
          <Spinner />
          <p className="mt-4">
            Estamos validando com o MercadoPago. Isso costuma levar alguns segundos.
          </p>
          <p className="mt-2 text-xs text-ink/50">
            Tentativa {state.attempts} · {state.secondsLeft}s restantes
          </p>
          {mpPaymentId && (
            <p className="mt-1 text-[10px] text-ink/40">ID do pagamento: {mpPaymentId}</p>
          )}
        </Card>
      )}

      {state.kind === "approved" && (
        <Card title="Pagamento confirmado!" tone="ok">
          <p>Tua página tá no ar. O link foi enviado pro e-mail cadastrado. 💌</p>
          <Link
            href={`/p/${state.slug}`}
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft"
          >
            Ver minha página
          </Link>
        </Card>
      )}

      {state.kind === "pending" && (
        <Card title="Ainda processando" tone="warn">
          <p>
            O pagamento foi recebido mas o MercadoPago ainda não confirmou (comum em Pix).
            Assim que aprovar, mandamos o link no seu e-mail. Pode fechar essa página.
          </p>
        </Card>
      )}

      {state.kind === "rejected" && (
        <Card title="Algo deu errado" tone="bad">
          <p>{state.reason}</p>
          <Link href="/criar" className="mt-6 inline-block rounded-full border border-ink/15 bg-cream px-5 py-2.5 text-sm font-semibold text-ink">
            Tentar de novo
          </Link>
        </Card>
      )}

      {state.kind === "error" && (
        <Card title="Erro ao verificar pagamento" tone="bad">
          <p>{state.reason}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full border border-ink/15 bg-cream px-5 py-2.5 text-sm font-semibold text-ink"
          >
            Tentar de novo
          </button>
        </Card>
      )}

      {/* fallback: se já tinha slug no store, oferece o link mesmo sem polling */}
      {state.kind !== "approved" && slugInStore && (
        <p className="mt-6 text-xs text-ink/40">
          Slug provisório: <code className="font-mono">{slugInStore}</code>
        </p>
      )}
    </div>
  );
}

function Card({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "ok" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const ring =
    tone === "ok"   ? "border-lilac-200 bg-white/70" :
    tone === "warn" ? "border-amber-200 bg-amber-50/60" :
                      "border-rose-200 bg-rose-50/60";
  return (
    <div className={`rounded-3xl border ${ring} p-8 text-ink shadow-soft backdrop-blur`}>
      <h1 className="font-display text-2xl font-bold md:text-3xl">{title}</h1>
      <div className="mt-3 text-ink/70">{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-4 border-rose-300 border-t-rose-500" />
  );
}
