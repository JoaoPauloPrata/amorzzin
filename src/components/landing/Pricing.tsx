import Link from "next/link";
import { getSupabaseAnonServerClient } from "@/lib/supabase/server";

type Plan = {
  id: string;
  display_name: string;
  price_cents: number;
  duration_days: number | null;
  max_photos: number;
  max_message_length: number;
};

const PLAN_COPY: Record<string, { tagline: string; features: string[]; highlight?: boolean }> = {
  monthly: {
    tagline: "Pra testar e mandar agora.",
    features: [
      "Acesso à página por 30 dias",
      "Até 4 fotos no carrossel",
      "Mensagem com até 800 caracteres",
      "QR Code + link no e-mail",
      "Música embed (YouTube ou Spotify)",
    ],
  },
  annual: {
    tagline: "Pra durar o ano todo.",
    features: [
      "Acesso à página por 1 ano",
      "Até 8 fotos no carrossel",
      "Mensagem com até 1500 caracteres",
      "QR Code + link no e-mail",
      "Música embed (YouTube ou Spotify)",
      "Suporte prioritário",
    ],
    highlight: true,
  },
};

function formatPrice(cents: number) {
  const reais = (cents / 100).toFixed(2).replace(".", ",");
  return `R$ ${reais}`;
}

export async function Pricing() {
  const supabase = getSupabaseAnonServerClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id, display_name, price_cents, duration_days, max_photos, max_message_length")
    .eq("active", true)
    .order("price_cents", { ascending: true });

  if (error || !data) {
    console.error("Failed to load plans", error);
    return null;
  }

  const plans = data as Plan[];

  return (
    <section id="planos" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-rose-700 backdrop-blur">
            💎 Planos
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
            Pague uma vez. <span className="gradient-text">Sem assinatura.</span>
          </h2>
          <p className="mt-4 text-lg text-ink/70 text-balance">
            Escolha por quanto tempo a página fica no ar. Pix ou cartão.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
          {plans.map((plan) => {
            const copy = PLAN_COPY[plan.id] ?? { tagline: "", features: [] };
            const durationLabel = (() => {
              if (plan.duration_days === null) return "vitalício";
              if (plan.duration_days >= 365) return "1 ano";
              if (plan.duration_days >= 60) return `${Math.round(plan.duration_days / 30)} meses`;
              return `${plan.duration_days} dias`;
            })();

            return (
              <div
                key={plan.id}
                className={
                  copy.highlight
                    ? "relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 to-lilac-500 p-[2px] shadow-soft"
                    : "rounded-3xl border border-rose-100 bg-white/70 backdrop-blur"
                }
              >
                {copy.highlight && (
                  <span className="absolute right-6 top-6 z-10 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 shadow">
                    Mais escolhido
                  </span>
                )}

                <div
                  className={
                    copy.highlight
                      ? "rounded-[calc(1.5rem-2px)] bg-white p-8"
                      : "p-8"
                  }
                >
                  <h3 className="text-xl font-semibold text-ink">{plan.display_name}</h3>
                  <p className="mt-1 text-sm text-ink/60">{copy.tagline}</p>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-display text-5xl font-bold text-ink">
                      {formatPrice(plan.price_cents)}
                    </span>
                    <span className="text-sm text-ink/60">uma vez</span>
                  </div>
                  <p className="mt-1 text-xs text-ink/50">
                    Acesso {durationLabel} · até {plan.max_photos} fotos
                  </p>

                  <ul className="mt-6 space-y-3">
                    {copy.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink/80">
                        <span className="mt-0.5 text-rose-500">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/criar?plano=${plan.id}`}
                    className={
                      copy.highlight
                        ? "mt-8 block rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-6 py-3.5 text-center text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                        : "mt-8 block rounded-full border border-ink/15 bg-cream px-6 py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:border-ink/30"
                    }
                  >
                    Escolher {plan.display_name}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-ink/50">
          Pagamento processado pelo MercadoPago. Pix, cartão de crédito ou débito.
        </p>
      </div>
    </section>
  );
}
