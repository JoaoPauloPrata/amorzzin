import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSupabaseAnonServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { parseYouTubeUrl } from "@/lib/utils/youtube";
import { PublicPage } from "@/components/public/PublicPage";
import { ExpiredPage } from "@/components/public/ExpiredPage";

export const dynamic = "force-dynamic";

const PHOTO_BUCKET = "page-photos";

type PageData = {
  id:                     string;
  slug:                   string;
  title:                  string | null;
  recipient_name:         string | null;
  message:                string | null;
  relationship_start:     string | null;
  music_embed_url:        string | null;
  music_provider:         string | null;
  animation_type:         string | null;
  animation_custom_emoji: string | null;
  layout_style:           string | null;
  sections:               { title: string; body: string }[];
  photos:                 string[];
};

// Normaliza o jsonb de seções para { title, body }[] válido.
function normalizeSections(raw: unknown): { title: string; body: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => {
      const o = s as { title?: unknown; body?: unknown };
      return {
        title: typeof o?.title === "string" ? o.title : "",
        body:  typeof o?.body === "string" ? o.body : "",
      };
    })
    .filter((s) => s.title || s.body);
}

type LoadResult =
  | { kind: "active";   page: PageData }
  | { kind: "expired";  recipient: string | null }
  | { kind: "notfound" };

// React.cache dedupa a query entre generateMetadata e o componente (mesma request).
const loadPage = cache(async (slug: string): Promise<LoadResult> => {
  const supabase = getSupabaseAnonServerClient();

  // RLS já filtra: só páginas status='active' e não expiradas são legíveis pelo anon.
  const { data: page, error } = await supabase
    .from("pages")
    .select(
      "id, slug, title, recipient_name, message, relationship_start, music_embed_url, music_provider, animation_type, animation_custom_emoji, layout_style, sections",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("public page load failed", error);
    return { kind: "notfound" };
  }

  if (!page) {
    // RLS escondeu: ou não existe, ou está expirada. Distingue com service client
    // (bypass RLS) pra mostrar tela de "expirada" em vez de 404 genérico.
    const admin = getSupabaseServiceClient();
    const { data: maybe } = await admin
      .from("pages")
      .select("recipient_name, status, expires_at")
      .eq("slug", slug)
      .maybeSingle();

    if (maybe && (maybe.status === "expired" || (maybe.expires_at && new Date(maybe.expires_at) < new Date()))) {
      return { kind: "expired", recipient: maybe.recipient_name };
    }
    return { kind: "notfound" };
  }

  const { data: photoRows } = await supabase
    .from("page_photos")
    .select("storage_path, position")
    .eq("page_id", page.id)
    .order("position", { ascending: true });

  const photos = (photoRows ?? []).map(
    (r) => supabase.storage.from(PHOTO_BUCKET).getPublicUrl(r.storage_path).data.publicUrl,
  );

  return {
    kind: "active",
    page: { ...page, sections: normalizeSections((page as { sections?: unknown }).sections), photos },
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await loadPage(slug);
  if (result.kind === "expired") return { title: "Página expirada — Amorzin", robots: { index: false } };
  if (result.kind !== "active") return { title: "Página não encontrada — Amorzin" };
  const page = result.page;

  const who = page.recipient_name ? `Para ${page.recipient_name}` : "Amorzin";
  const title = page.title?.trim() || who;
  const description = page.message?.trim()?.slice(0, 160) || "Uma página feita com amor 💛";

  // og:image / twitter:image vêm do arquivo opengraph-image.tsx (imagem composta).
  return {
    title: `${title} 💛`,
    description,
    robots: { index: false, follow: false }, // páginas privadas não indexam
    openGraph: {
      title: `${title} 💛`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} 💛`,
      description,
    },
  };
}

export default async function PublicGiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await loadPage(slug);
  if (result.kind === "expired") return <ExpiredPage recipient={result.recipient} />;
  if (result.kind !== "active") notFound();
  const page = result.page;

  const yt = parseYouTubeUrl(page.music_embed_url);

  return (
    <PublicPage
      title={page.title}
      recipient={page.recipient_name}
      message={page.message}
      relationshipStart={page.relationship_start}
      photos={page.photos}
      musicVideoId={page.music_provider === "youtube" ? yt?.videoId ?? null : null}
      animationType={page.animation_type}
      animationCustomEmoji={page.animation_custom_emoji}
      layoutStyle={page.layout_style}
      sections={page.sections}
    />
  );
}
