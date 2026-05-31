import { ImageResponse } from "next/og";
import { getSupabaseAnonServerClient } from "@/lib/supabase/server";

// Imagem de preview (OpenGraph) gerada por página — aparece ao compartilhar o link
// no WhatsApp/Instagram/iMessage etc. 1200×630, composta: foto de fundo + título +
// "Para X" + tempo juntos + marca. Renderizada server-side (next/og → PNG).
//
// Só páginas ativas (RLS via anon) entram; senão cai no fallback de marca.

export const runtime = "nodejs";
export const alt = "Página personalizada feita na Amorzin";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PHOTO_BUCKET = "page-photos";

function togetherLabel(iso: string | null): string | null {
  if (!iso) return null;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) { months += 12; years -= 1; }
  if (years > 0) return `${years} ${years === 1 ? "ano" : "anos"} juntos`;
  if (months > 0) return `${months} ${months === 1 ? "mês" : "meses"} juntos`;
  return "começando a história";
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let title = "Uma página feita com amor";
  let recipient: string | null = null;
  let cover: string | null = null;
  let together: string | null = null;

  try {
    const supabase = getSupabaseAnonServerClient();
    const { data: page } = await supabase
      .from("pages")
      .select("id, title, recipient_name, relationship_start")
      .eq("slug", slug)
      .maybeSingle();

    if (page) {
      if (page.title?.trim()) title = page.title.trim();
      recipient = page.recipient_name?.trim() || null;
      together = togetherLabel(page.relationship_start);

      const { data: photoRows } = await supabase
        .from("page_photos")
        .select("storage_path")
        .eq("page_id", page.id)
        .order("position", { ascending: true })
        .limit(1);

      const path = photoRows?.[0]?.storage_path;
      if (path) cover = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
    }
  } catch {
    // qualquer falha → fallback de marca (abaixo)
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "linear-gradient(135deg, #FF4E88 0%, #A26BE8 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* foto de fundo */}
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}

        {/* overlay escuro pra legibilidade */}
        <div style={{ position: "absolute", inset: 0, display: "flex", background: "linear-gradient(to bottom, rgba(22,10,20,0.30) 0%, rgba(22,10,20,0.55) 55%, rgba(22,10,20,0.85) 100%)" }} />

        {/* conteúdo */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%", height: "100%", padding: "72px 80px", color: "#ffffff" }}>
          {recipient && (
            <div style={{ display: "flex", fontSize: 30, fontWeight: 600, letterSpacing: 8, textTransform: "uppercase", color: "rgba(255,255,255,0.85)", marginBottom: 18 }}>
              Para {recipient}
            </div>
          )}

          <div style={{ display: "flex", fontSize: title.length > 28 ? 84 : 108, fontWeight: 800, lineHeight: 1.0, maxWidth: 980, textShadow: "0 4px 30px rgba(0,0,0,0.45)" }}>
            {title}
          </div>

          <div style={{ display: "flex", width: 96, height: 6, borderRadius: 999, background: "#FF9DBE", marginTop: 28 }} />

          <div style={{ display: "flex", alignItems: "center", marginTop: 28, fontSize: 30, color: "rgba(255,255,255,0.9)" }}>
            <span style={{ display: "flex", color: "#FF9DBE", marginRight: 14, fontSize: 34 }}>♥</span>
            {together ?? "feito pra durar"}
          </div>
        </div>

        {/* marca no topo */}
        <div style={{ position: "absolute", top: 56, left: 80, display: "flex", alignItems: "center", color: "#ffffff", fontSize: 34, fontWeight: 700 }}>
          <span style={{ display: "flex", color: "#FF9DBE", marginRight: 12, fontSize: 38 }}>♥</span>
          amorzin
        </div>
      </div>
    ),
    { ...size },
  );
}
