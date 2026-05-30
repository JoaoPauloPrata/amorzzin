"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  createPagePayloadSchema,
  updatePagePayloadSchema,
  type CreatePagePayload,
  type UpdatePagePayload,
} from "@/lib/wizard/schemas";

export type CreatePageResult =
  | { ok: true; id: string; slug: string; edit_token: string }
  | { ok: false; error: string };

export async function createPage(input: CreatePagePayload): Promise<CreatePageResult> {
  const parsed = createPagePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("pages")
    .insert({
      status: "draft",
      ...parsed.data,
    })
    .select("id, slug, edit_token")
    .single();

  if (error || !data) {
    console.error("createPage failed", error);
    return { ok: false, error: "Não consegui criar a página. Tenta de novo." };
  }

  return { ok: true, id: data.id, slug: data.slug, edit_token: data.edit_token };
}

export type UpdatePageResult = { ok: true } | { ok: false; error: string };

export async function updatePage(input: UpdatePagePayload): Promise<UpdatePageResult> {
  const parsed = updatePagePayloadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const { id, edit_token, ...patch } = parsed.data;

  const supabase = getSupabaseServiceClient();

  const { data: page, error: selectError } = await supabase
    .from("pages")
    .select("id, edit_token, status")
    .eq("id", id)
    .maybeSingle();

  if (selectError) {
    console.error("updatePage select failed", selectError);
    return { ok: false, error: "Erro ao buscar página." };
  }
  if (!page) {
    return { ok: false, error: "Página não encontrada." };
  }
  if (page.edit_token !== edit_token) {
    return { ok: false, error: "Token inválido." };
  }
  if (page.status === "active" || page.status === "expired") {
    return { ok: false, error: "Página já publicada — não pode editar texto." };
  }

  if (Object.keys(patch).length === 0) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("pages")
    .update(patch)
    .eq("id", id);

  if (updateError) {
    console.error("updatePage update failed", updateError);
    return { ok: false, error: "Erro ao salvar." };
  }

  return { ok: true };
}
