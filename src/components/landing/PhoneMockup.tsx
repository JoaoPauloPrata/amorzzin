"use client";

import { useEffect, useState } from "react";

// Ordem pedida: Polaroid → Revista (editorial) → Galeria → Imersão.
const SLIDES = [
  { src: "/mockup/polaroid.webp",  alt: "Exemplo de página no estilo Polaroid" },
  { src: "/mockup/editorial.webp", alt: "Exemplo de página no estilo Revista" },
  { src: "/mockup/gallery.webp",   alt: "Exemplo de página no estilo Galeria" },
  { src: "/mockup/immersive.webp", alt: "Exemplo de página no estilo Imersivo" },
];

const INTERVAL_MS = 3200;

export function PhoneMockup() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return; // sem rotação pra quem pede menos movimento
    const t = setInterval(() => setI((p) => (p + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-rose-200/60 via-lilac-200/60 to-transparent blur-2xl" />
      <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-3 shadow-soft backdrop-blur">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-rose-100">
          {SLIDES.map((s, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.src}
              src={s.src}
              alt={s.alt}
              className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${idx === i ? "opacity-100" : "opacity-0"}`}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          ))}

          {/* indicadores de qual estilo está sendo mostrado */}
          <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
            {SLIDES.map((s, idx) => (
              <span
                key={s.src}
                className={`h-1.5 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-all duration-500 ${idx === i ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 text-center text-xs font-medium text-ink/60">
        › Pré-visualização real do que você cria
      </div>
    </div>
  );
}
