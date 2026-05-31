import Link from "next/link";
import { notFound } from "next/navigation";

import type { LayoutProps } from "@/components/public/shared";
import { Immersive } from "@/components/public/layouts/Immersive";
import { Polaroid } from "@/components/public/layouts/Polaroid";
import { Editorial } from "@/components/public/layouts/Editorial";
import { Gallery } from "@/components/public/layouts/Gallery";

export const dynamic = "force-dynamic";

const STYLES = ["immersive", "polaroid", "editorial", "gallery"] as const;
type Style = (typeof STYLES)[number];

// Fotos fake estáveis (picsum por seed).
const PHOTOS = [
  "https://picsum.photos/seed/amorzin1/900/1200",
  "https://picsum.photos/seed/amorzin2/900/1200",
  "https://picsum.photos/seed/amorzin3/1200/900",
  "https://picsum.photos/seed/amorzin4/900/1200",
  "https://picsum.photos/seed/amorzin5/1200/900",
  "https://picsum.photos/seed/amorzin6/900/1200",
];

const FAKE: LayoutProps = {
  title:             "Eu te amo",
  recipient:         "Marina",
  message:           "Desde o dia em que te conheci, tudo ficou mais leve.\nObrigado por ser meu lugar favorito no mundo. 💛",
  relationshipStart: "2021-06-12",
  photos:            PHOTOS,
  musicVideoId:      null,
  emoji:             "❤️",
  autoOpen:          true,
  sections: [
    { title: "Nossa história", body: "Começou num café chuvoso de terça. Você atrasou 20 minutos e mesmo assim foi o melhor encontro da minha vida." },
    { title: "O que mais amo em você", body: "Seu jeito de rir alto sem se importar com quem está olhando. Sua coragem. O jeito que você me olha quando acha que eu não tô vendo." },
    { title: "Nossos sonhos", body: "Uma casa com varanda, um cachorro chamado Pão, e mil viagens de mãos dadas. Tudo com você." },
  ],
};

const LAYOUTS = { immersive: Immersive, polaroid: Polaroid, editorial: Editorial, gallery: Gallery };

export default async function DevStylePreview({ params }: { params: Promise<{ style: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();

  const { style } = await params;
  if (!STYLES.includes(style as Style)) notFound();
  const Layout = LAYOUTS[style as Style];

  return (
    <>
      {/* barra de troca de estilo (só dev) */}
      <div className="fixed left-1/2 top-3 z-[60] flex -translate-x-1/2 gap-1 rounded-full border border-black/10 bg-white/90 p-1 text-xs font-semibold shadow-lg backdrop-blur">
        {STYLES.map((s) => (
          <Link
            key={s}
            href={`/dev/styles/${s}`}
            className={
              s === style
                ? "rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-3 py-1.5 text-white"
                : "rounded-full px-3 py-1.5 text-ink/60 hover:bg-rose-50 hover:text-rose-600"
            }
          >
            {s}
          </Link>
        ))}
      </div>

      <Layout {...FAKE} />
    </>
  );
}
