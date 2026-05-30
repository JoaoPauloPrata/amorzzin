"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/server";

export type PlanDTO = {
  id:               string;
  display_name:     string;
  price_cents:      number;
  duration_days:    number | null;
  max_photos:       number;
  max_message_length: number;
};

export type ListPlansResult =
  | { ok: true; plans: PlanDTO[] }
  | { ok: false; error: string };

export async function listPlans(): Promise<ListPlansResult> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id, display_name, price_cents, duration_days, max_photos, max_message_length")
    .eq("active", true)
    .order("price_cents", { ascending: true });

  if (error) {
    console.error("listPlans failed", error);
    return { ok: false, error: "Erro ao carregar planos." };
  }
  return { ok: true, plans: data ?? [] };
}
