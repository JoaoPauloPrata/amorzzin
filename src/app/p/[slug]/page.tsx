import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getSupabaseAnonServerClient } from "@/lib/supabase/server";
import { parseYouTubeUrl } from "@/lib/utils/youtube";
import { PublicPage } from "@/components/public/PublicPage";

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
  carousel_style:         string | null;
  photos:                 string[];
};

// React.cache dedupa a query entre generateMetadata e o componente (mesma request).
const loadPage = cache(async (slug: string): Promise<PageData | null> => {
  const supabase = getSupabaseAnonServerClient();

  // RLS já filtra: só páginas status='active' e não expiradas são legíveis pelo anon.
  const { data: page, error } = await supabase
    .from("pages")
    .select(
      "id, slug, title, recipient_name, message, relationship_start, music_embed_url, music_provider, animation_type, animation_custom_emoji, carousel_style",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("public page load failed", error);
    return null;
  }
  if (!page) return null;

  const { data: photoRows } = await supabase
    .from("page_photos")
    .select("storage_path, position")
    .eq("page_id", page.id)
    .order("position", { ascending: true });

  const photos = (photoRows ?? []).map(
    (r) => supabase.storage.from(PHOTO_BUCKET).getPublicUrl(r.storage_path).data.publicUrl,
  );

  return { ...page, photos };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: "Página não encontrada — Amorzin" };

  const who = page.recipient_name ? `Para ${page.recipient_name}` : "Amorzin";
  const title = page.title?.trim() || who;
  const description = page.message?.trim()?.slice(0, 160) || "Uma página feita com amor 💛";
  const cover = page.photos[0];

  return {
    title: `${title} 💛`,
    description,
    robots: { index: false, follow: false }, // páginas privadas não indexam
    openGraph: {
      title: `${title} 💛`,
      description,
      type: "website",
      images: cover ? [{ url: cover }] : undefined,
    },
    twitter: {
      card: cover ? "summary_large_image" : "summary",
      title: `${title} 💛`,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default async function PublicGiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();

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
      carouselStyle={page.carousel_style}
    />
  );
}
