import Link from "next/link";
import { notFound } from "next/navigation";

import { Immersive } from "@/components/public/layouts/Immersive";
import { Polaroid } from "@/components/public/layouts/Polaroid";
import { Editorial } from "@/components/public/layouts/Editorial";
import { Gallery } from "@/components/public/layouts/Gallery";
import { EXAMPLE_PAGE, EXAMPLE_STYLES, type ExampleStyle } from "@/lib/example-page";

export const dynamic = "force-dynamic";

const LAYOUTS = { immersive: Immersive, polaroid: Polaroid, editorial: Editorial, gallery: Gallery };

export default async function DevStylePreview({ params }: { params: Promise<{ style: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();

  const { style } = await params;
  if (!EXAMPLE_STYLES.includes(style as ExampleStyle)) notFound();
  const Layout = LAYOUTS[style as ExampleStyle];

  return (
    <>
      {/* barra de troca de estilo (só dev) */}
      <div className="fixed left-1/2 top-3 z-[60] flex -translate-x-1/2 gap-1 rounded-full border border-black/10 bg-white/90 p-1 text-xs font-semibold shadow-lg backdrop-blur">
        {EXAMPLE_STYLES.map((s) => (
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

      <Layout {...EXAMPLE_PAGE} />
    </>
  );
}
