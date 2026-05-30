"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import {
  PHOTO_ALLOWED_MIME,
  PHOTO_FALLBACK_MAX,
  PHOTO_MAX_BYTES,
  deletePhotoPayloadSchema,
  photoIdentitySchema,
  reorderPhotosPayloadSchema,
  type DeletePhotoPayload,
  type PhotoIdentity,
  type ReorderPhotosPayload,
  type PhotoMime,
} from "@/lib/wizard/schemas";

const BUCKET = "page-photos";

export type PhotoDTO = {
  id:         string;
  position:   number;
  url:        string;
  storagePath:string;
};

type ActionError = { ok: false; error: string };

type PageContext = {
  supabase: ReturnType<typeof getSupabaseServiceClient>;
  page: {
    id: string;
    edit_token: string;
    status: string;
    plan_id: string | null;
  };
};

type LoadResult =
  | { ok: true; ctx: PageContext }
  | { ok: false; error: string };

async function loadPageForMutation(pageId: string, editToken: string): Promise<LoadResult> {
  const supabase = getSupabaseServiceClient();

  const { data: page, error } = await supabase
    .from("pages")
    .select("id, edit_token, status, plan_id")
    .eq("id", pageId)
    .maybeSingle();

  if (error) {
    console.error("loadPageForMutation select failed", error);
    return { ok: false, error: "Erro ao buscar página." };
  }
  if (!page)                       return { ok: false, error: "Página não encontrada." };
  if (page.edit_token !== editToken)
                                   return { ok: false, error: "Token inválido." };
  if (page.status === "active" || page.status === "expired")
                                   return { ok: false, error: "Página já publicada — não pode editar fotos." };

  return { ok: true, ctx: { supabase, page } };
}

async function maxPhotosFor(planId: string | null): Promise<number> {
  if (!planId) return PHOTO_FALLBACK_MAX;
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("plans")
    .select("max_photos")
    .eq("id", planId)
    .maybeSingle();
  if (error || !data) return PHOTO_FALLBACK_MAX;
  return data.max_photos;
}

function publicUrlFor(storagePath: string): string {
  const supabase = getSupabaseServiceClient();
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function extFromMime(mime: PhotoMime): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png":  return "png";
    case "image/webp": return "webp";
    case "image/heic": return "heic";
  }
}

// ────────────────────────────────────────────────────────────────────────────
// listPhotos
// ────────────────────────────────────────────────────────────────────────────

export type ListPhotosResult =
  | { ok: true; photos: PhotoDTO[]; maxPhotos: number }
  | ActionError;

export async function listPhotos(input: PhotoIdentity): Promise<ListPhotosResult> {
  const parsed = photoIdentitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const loaded = await loadPageForMutation(parsed.data.page_id, parsed.data.edit_token);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const ctx = loaded.ctx;

  const { data, error } = await ctx.supabase
    .from("page_photos")
    .select("id, position, storage_path")
    .eq("page_id", parsed.data.page_id)
    .order("position", { ascending: true });

  if (error) {
    console.error("listPhotos failed", error);
    return { ok: false, error: "Erro ao listar fotos." };
  }

  const photos: PhotoDTO[] = (data ?? []).map((row) => ({
    id:          row.id,
    position:    row.position,
    storagePath: row.storage_path,
    url:         publicUrlFor(row.storage_path),
  }));

  const maxPhotos = await maxPhotosFor(ctx.page.plan_id);
  return { ok: true, photos, maxPhotos };
}

// ────────────────────────────────────────────────────────────────────────────
// uploadPhoto  —  FormData(page_id, edit_token, file)
// ────────────────────────────────────────────────────────────────────────────

export type UploadPhotoResult =
  | { ok: true; photo: PhotoDTO }
  | ActionError;

export async function uploadPhoto(formData: FormData): Promise<UploadPhotoResult> {
  const pageId    = formData.get("page_id");
  const editToken = formData.get("edit_token");
  const file      = formData.get("file");

  if (typeof pageId !== "string" || typeof editToken !== "string") {
    return { ok: false, error: "Identificação da página ausente." };
  }
  if (!(file instanceof File)) {
    return { ok: false, error: "Arquivo ausente." };
  }

  const idCheck = photoIdentitySchema.safeParse({ page_id: pageId, edit_token: editToken });
  if (!idCheck.success) return { ok: false, error: idCheck.error.issues[0]?.message ?? "Dados inválidos" };

  if (!(PHOTO_ALLOWED_MIME as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Formato não suportado. Use JPG, PNG, WebP ou HEIC." };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { ok: false, error: "Imagem maior que 5 MB." };
  }
  if (file.size === 0) {
    return { ok: false, error: "Arquivo vazio." };
  }

  const loaded = await loadPageForMutation(idCheck.data.page_id, idCheck.data.edit_token);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const ctx = loaded.ctx;

  const { count, error: countError } = await ctx.supabase
    .from("page_photos")
    .select("id", { count: "exact", head: true })
    .eq("page_id", idCheck.data.page_id);

  if (countError) {
    console.error("uploadPhoto count failed", countError);
    return { ok: false, error: "Erro ao contar fotos." };
  }

  const current   = count ?? 0;
  const maxPhotos = await maxPhotosFor(ctx.page.plan_id);
  if (current >= maxPhotos) {
    return { ok: false, error: `Limite de ${maxPhotos} fotos atingido.` };
  }

  const ext  = extFromMime(file.type as PhotoMime);
  const uuid = crypto.randomUUID();
  const path = `${idCheck.data.page_id}/${uuid}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await ctx.supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("uploadPhoto upload failed", uploadError);
    return { ok: false, error: "Falha ao enviar imagem." };
  }

  const { data: inserted, error: insertError } = await ctx.supabase
    .from("page_photos")
    .insert({
      page_id:      idCheck.data.page_id,
      position:     current,
      storage_path: path,
    })
    .select("id, position, storage_path")
    .single();

  if (insertError || !inserted) {
    console.error("uploadPhoto insert failed", insertError);
    // Best-effort cleanup do object pra não deixar lixo.
    await ctx.supabase.storage.from(BUCKET).remove([path]);
    return { ok: false, error: "Erro ao salvar foto." };
  }

  return {
    ok: true,
    photo: {
      id:          inserted.id,
      position:    inserted.position,
      storagePath: inserted.storage_path,
      url:         publicUrlFor(inserted.storage_path),
    },
  };
}

// ────────────────────────────────────────────────────────────────────────────
// deletePhoto
// ────────────────────────────────────────────────────────────────────────────

export type DeletePhotoResult = { ok: true } | ActionError;

export async function deletePhoto(input: DeletePhotoPayload): Promise<DeletePhotoResult> {
  const parsed = deletePhotoPayloadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const loaded = await loadPageForMutation(parsed.data.page_id, parsed.data.edit_token);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const ctx = loaded.ctx;

  const { data: photo, error: selectError } = await ctx.supabase
    .from("page_photos")
    .select("id, storage_path, page_id")
    .eq("id", parsed.data.photo_id)
    .maybeSingle();

  if (selectError) {
    console.error("deletePhoto select failed", selectError);
    return { ok: false, error: "Erro ao buscar foto." };
  }
  if (!photo || photo.page_id !== parsed.data.page_id) {
    return { ok: false, error: "Foto não pertence a essa página." };
  }

  const { error: deleteRowError } = await ctx.supabase
    .from("page_photos")
    .delete()
    .eq("id", photo.id);

  if (deleteRowError) {
    console.error("deletePhoto delete row failed", deleteRowError);
    return { ok: false, error: "Erro ao remover foto." };
  }

  const { error: storageError } = await ctx.supabase.storage
    .from(BUCKET)
    .remove([photo.storage_path]);

  if (storageError) {
    console.warn("deletePhoto storage remove failed (row já removido)", storageError);
  }

  const { error: resequenceError } = await ctx.supabase.rpc("resequence_page_photos", {
    p_page_id: parsed.data.page_id,
  });
  if (resequenceError) {
    console.warn("deletePhoto resequence failed", resequenceError);
  }

  return { ok: true };
}

// ────────────────────────────────────────────────────────────────────────────
// reorderPhotos
// ────────────────────────────────────────────────────────────────────────────

export type ReorderPhotosResult = { ok: true } | ActionError;

export async function reorderPhotos(input: ReorderPhotosPayload): Promise<ReorderPhotosResult> {
  const parsed = reorderPhotosPayloadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const loaded = await loadPageForMutation(parsed.data.page_id, parsed.data.edit_token);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const ctx = loaded.ctx;

  const { error } = await ctx.supabase.rpc("reorder_page_photos", {
    p_page_id:     parsed.data.page_id,
    p_edit_token:  parsed.data.edit_token,
    p_ordered_ids: parsed.data.ordered_ids,
  });

  if (error) {
    console.error("reorderPhotos rpc failed", error);
    return { ok: false, error: "Erro ao reordenar fotos." };
  }

  return { ok: true };
}
