"use server";

import { z } from "zod";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { getPreferenceClient } from "@/lib/mercadopago/client";

const createPreferencePayloadSchema = z.object({
  page_id:    z.string().uuid(),
  edit_token: z.string().uuid(),
  plan_id:    z.string().min(1).max(40),
});

export type CreatePreferenceInput = z.infer<typeof createPreferencePayloadSchema>;

export type CreatePreferenceResult =
  | { ok: true; init_point: string; preference_id: string }
  | { ok: false; error: string };

export async function createPaymentPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResult> {
  const parsed = createPreferencePayloadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const { page_id, edit_token, plan_id } = parsed.data;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!siteUrl)    return { ok: false, error: "Config: NEXT_PUBLIC_SITE_URL ausente." };
  if (!supabaseUrl)return { ok: false, error: "Config: NEXT_PUBLIC_SUPABASE_URL ausente." };

  const supabase = getSupabaseServiceClient();

  // 1. Valida page + edit_token + status
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id, edit_token, status, recipient_name, title, contact_email")
    .eq("id", page_id)
    .maybeSingle();

  if (pageError) {
    console.error("createPaymentPreference page select failed", pageError);
    return { ok: false, error: "Erro ao buscar página." };
  }
  if (!page)                          return { ok: false, error: "Página não encontrada." };
  if (page.edit_token !== edit_token) return { ok: false, error: "Token inválido." };
  if (page.status === "active" || page.status === "expired") {
    return { ok: false, error: "Página já publicada." };
  }
  if (!page.contact_email) {
    return { ok: false, error: "Cadastra um e-mail antes de pagar." };
  }

  // 2. Valida plan
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, display_name, price_cents, active")
    .eq("id", plan_id)
    .maybeSingle();

  if (planError) {
    console.error("createPaymentPreference plan select failed", planError);
    return { ok: false, error: "Erro ao buscar plano." };
  }
  if (!plan || !plan.active) return { ok: false, error: "Plano indisponível." };

  // 3. Cria preference no MercadoPago
  const preferenceClient = getPreferenceClient();
  const amountReais = plan.price_cents / 100;

  let preferenceId: string | undefined;
  let initPoint:    string | undefined;

  const isLocalSiteUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(siteUrl);

  try {
    const result = await preferenceClient.create({
      body: {
        items: [
          {
            id:          plan.id,
            title:       `Amorzzin — Plano ${plan.display_name}`,
            description: `Página de presente personalizada (${page.recipient_name ?? "para alguém especial"})`,
            quantity:    1,
            currency_id: "BRL",
            unit_price:  amountReais,
            category_id: "services",
          },
        ],
        payer: {
          email: page.contact_email,
        },
        back_urls: {
          success: `${siteUrl}/payment/return?page_id=${page_id}`,
          pending: `${siteUrl}/payment/return?page_id=${page_id}`,
          failure: `${siteUrl}/payment/return?page_id=${page_id}`,
        },
        ...(isLocalSiteUrl ? {} : { auto_return: "approved" as const }),
        payment_methods: {
          excluded_payment_types: [
            { id: "ticket" },
            { id: "atm" },
          ],
          excluded_payment_methods: [],
          installments: 12,
        },
        notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
        external_reference: page_id,
        statement_descriptor: "AMORZZIN",
        metadata: { page_id, plan_id },
      },
    });
    preferenceId = result.id;
    initPoint    = result.init_point;
  } catch (err) {
    console.error("createPaymentPreference MP create failed", err);
    return { ok: false, error: "Erro ao criar pagamento no MercadoPago." };
  }

  if (!preferenceId || !initPoint) {
    return { ok: false, error: "Resposta inválida do MercadoPago." };
  }

  // 4. UPSERT em payment_orders + atualiza status da página.
  //    Idempotência: se já existe uma order pending pra esse page+plan, atualiza preference_id.
  const { error: deleteError } = await supabase
    .from("payment_orders")
    .delete()
    .eq("page_id", page_id)
    .eq("status",  "pending");
  if (deleteError) {
    console.warn("createPaymentPreference cleanup pending failed", deleteError);
  }

  const { error: insertError } = await supabase
    .from("payment_orders")
    .insert({
      page_id,
      plan_id,
      amount_cents:           plan.price_cents,
      status:                 "pending",
      mp_preference_id:       preferenceId,
      mp_external_reference:  page_id,
    });

  if (insertError) {
    console.error("createPaymentPreference payment_orders insert failed", insertError);
    return { ok: false, error: "Erro ao registrar pedido." };
  }

  const { error: pageUpdateError } = await supabase
    .from("pages")
    .update({ status: "pending_payment", plan_id })
    .eq("id", page_id);

  if (pageUpdateError) {
    console.warn("createPaymentPreference pages.status update failed", pageUpdateError);
  }

  return { ok: true, init_point: initPoint, preference_id: preferenceId };
}

// ────────────────────────────────────────────────────────────────────────────
// getPaymentOrderStatus — usado pelo /payment/return pra polling
// ────────────────────────────────────────────────────────────────────────────

const statusPayloadSchema = z.object({
  page_id:    z.string().uuid(),
  edit_token: z.string().uuid(),
});

export type PaymentOrderStatus = "pending" | "approved" | "rejected" | "refunded" | "cancelled";

export type GetPaymentOrderStatusResult =
  | {
      ok: true;
      status: PaymentOrderStatus | null;
      page_status: string;
      slug: string;
    }
  | { ok: false; error: string };

export async function getPaymentOrderStatus(
  input: z.infer<typeof statusPayloadSchema>,
): Promise<GetPaymentOrderStatusResult> {
  const parsed = statusPayloadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const supabase = getSupabaseServiceClient();

  // valida edit_token
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("id, edit_token, status, slug")
    .eq("id", parsed.data.page_id)
    .maybeSingle();
  if (pageError) {
    console.error("getPaymentOrderStatus page select failed", pageError);
    return { ok: false, error: "Erro ao buscar página." };
  }
  if (!page)                                  return { ok: false, error: "Página não encontrada." };
  if (page.edit_token !== parsed.data.edit_token)
                                              return { ok: false, error: "Token inválido." };

  // mais recente primeiro
  const { data: order, error: orderError } = await supabase
    .from("payment_orders")
    .select("status, created_at")
    .eq("page_id", parsed.data.page_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (orderError) {
    console.error("getPaymentOrderStatus order select failed", orderError);
    return { ok: false, error: "Erro ao buscar pedido." };
  }

  return {
    ok: true,
    status:      (order?.status as PaymentOrderStatus | undefined) ?? null,
    page_status: page.status,
    slug:        page.slug,
  };
}
