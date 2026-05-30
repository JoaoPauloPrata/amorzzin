import "server-only";

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

// Lazy singleton. Module-level criação falharia em build se MP_ACCESS_TOKEN
// não estivesse setado, então adiamos pra runtime.

let _config: MercadoPagoConfig | null = null;

function getConfig(): MercadoPagoConfig {
  if (_config) return _config;

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      "Missing MP_ACCESS_TOKEN. Defina em .env.local (dev) e Vercel env (prod).",
    );
  }

  _config = new MercadoPagoConfig({
    accessToken: token,
    options: { timeout: 10_000, idempotencyKey: undefined },
  });
  return _config;
}

export function getPreferenceClient(): Preference {
  return new Preference(getConfig());
}

export function getPaymentClient(): Payment {
  return new Payment(getConfig());
}
