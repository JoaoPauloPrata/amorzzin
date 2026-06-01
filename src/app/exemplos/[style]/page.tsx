import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Immersive } from "@/components/public/layouts/Immersive";
import { Polaroid } from "@/components/public/layouts/Polaroid";
import { Editorial } from "@/components/public/layouts/Editorial";
import { Gallery } from "@/components/public/layouts/Gallery";
import {
  EXAMPLE_PAGE,
  EXAMPLE_STYLES,
  EXAMPLE_STYLE_LABELS,
  type ExampleStyle,
} from "@/lib/example-page";

const LAYOUTS = { immersive: Immersive, polaroid: Polaroid, editorial: Editorial, gallery: Gallery };

// Gera as 4 rotas estáticas no build.
export function generateStaticParams() {
  return EXAMPLE_STYLES.map((style) => ({ style }));
}

export async function generateMetadata({ params }: { params: Promise<{ style: string }> }): Promise<Metadata> {
  const { style } = await params;
  const label = EXAMPLE_STYLE_LABELS[style as ExampleStyle];
  if (!label) return { title: "Exemplos — Amorzin" };
  return {
    title: `Exemplo: estilo ${label} — Amorzin`,
    description: `Veja como fica uma página de presente no estilo ${label}. Crie a sua em 5 minutos.`,
  };
}

export default async function ExemploPage({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params;
  if (!EXAMPLE_STYLES.includes(style as ExampleStyle)) notFound();
  const Layout = LAYOUTS[style as ExampleStyle];

  return (
    <>
      {/* voltar pra home */}
      <Link
        href="/"
        aria-label="Voltar para o início"
        className="fixed left-3 top-3 z-[60] flex items-center gap-1.5 rounded-full border border-black/10 bg-white/90 px-3 py-2 text-xs font-semibold text-ink shadow-lg backdrop-blur transition-colors hover:text-rose-600"
      >
        <span aria-hidden>‹</span>
        <span className="hidden sm:inline">amorzin</span>
      </Link>

      {/* switcher de estilos */}
      <nav
        aria-label="Estilos de exemplo"
        className="fixed left-1/2 top-3 z-[60] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border border-black/10 bg-white/90 p-1 text-xs font-semibold shadow-lg backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {EXAMPLE_STYLES.map((s) => {
          const active = s === style;
          return (
            <Link
              key={s}
              href={`/exemplos/${s}`}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "shrink-0 rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-3.5 py-1.5 text-white"
                  : "shrink-0 rounded-full px-3.5 py-1.5 text-ink/60 transition-colors hover:bg-rose-50 hover:text-rose-600"
              }
            >
              {EXAMPLE_STYLE_LABELS[s]}
            </Link>
          );
        })}
      </nav>

      {/* CTA flutuante — a vitrine precisa converter */}
      <Link
        href="/criar"
        className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(214,51,108,0.6)] backdrop-blur transition-transform hover:scale-[1.03]"
      >
        💖 Criar minha página
      </Link>

      <Layout {...EXAMPLE_PAGE} />
    </>
  );
}
