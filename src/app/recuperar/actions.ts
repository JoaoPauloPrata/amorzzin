"use server";

import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().email();

// Janela mínima entre reenvios pro mesmo e-mail (anti email-bombing rudimentar).
// Hardening adicional (Turnstile/captcha + ratelimit por IP) fica no backlog anti-abuse.
const RESEND_COOLDOWN_MS = 10 * 60 * 1000;

export type RecoverResult = { ok: true } | { ok: false; error: string };

// Reenvia o e-mail com o link público + QR para uma página ativa cujo contact_email
// bate. Resposta é SEMPRE genérica (não revela se o e-mail existe) para evitar
// enumeração de e-mails.
export async function recoverPage(rawEmail: string): Promise<RecoverResult> {
  const parsed = emailSchema.safeParse(rawEmail);
  if (!parsed.success) return { ok: false, error: "E-mail inválido." };
  const email = parsed.data.toLowerCase();

  const admin = getSupabaseServiceClient();

  // Página ativa mais recente com esse e-mail.
  const { data: page, error } = await admin
    .from("pages")
    .select("id, email_sent_at")
    .eq("status", "active")
    .ilike("contact_email", email)
    .order("activated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("recoverPage select failed", error);
    // Resposta genérica mesmo em erro interno.
    return { ok: true };
  }

  // Sem página ativa → resposta genérica (não revela).
  if (!page) return { ok: true };

  // Cooldown: se reenviou há pouco, não reenvia de novo (silencioso).
  if (page.email_sent_at && Date.now() - new Date(page.email_sent_at).getTime() < RESEND_COOLDOWN_MS) {
    return { ok: true };
  }

  try {
    // Limpa o claim pra que send-confirmation-email reenvie.
    await admin.from("pages").update({ email_sent_at: null }).eq("id", page.id);

    // Lê o segredo de cron do Vault (RPC só pra service_role) pra autenticar na função.
    const { data: secret, error: secretErr } = await admin.rpc("get_cron_secret");
    if (secretErr || !secret) {
      console.error("recoverPage get_cron_secret failed", secretErr);
      return { ok: true };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const r = await fetch(`${supabaseUrl}/functions/v1/send-confirmation-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_id: page.id }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.warn("recoverPage send-confirmation-email não-OK", r.status, text.slice(0, 200));
    }
  } catch (err) {
    console.error("recoverPage threw", err);
  }

  return { ok: true };
}
