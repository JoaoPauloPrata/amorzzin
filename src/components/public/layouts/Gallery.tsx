"use client";

import { useState } from "react";
import { DateCounter } from "@/components/wizard/DateCounter";
import { FloatingHearts, OpenOverlay, MusicPlayer, StorySections, useReveal, type LayoutProps } from "../shared";
import { cn } from "@/lib/utils/cn";

export function Gallery(props: LayoutProps) {
  const { photos } = props;
  const { started, open } = useReveal(props.autoOpen);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const title = props.title?.trim();
  const recipient = props.recipient?.trim();
  const message = props.message?.trim();

  return (
    <main className="relative min-h-[100svh] w-full overflow-x-hidden bg-[#fffaf7] text-ink">
      <FloatingHearts emoji={props.emoji} subtle count={9} />

      <section
        className={cn(
          "relative z-10 mx-auto max-w-3xl px-5 py-16 transition-all duration-1000",
          started ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-3 opacity-0 blur-sm",
        )}
      >
        <header className="mb-10 text-center">
          {recipient && <p className="mb-3 max-w-full break-words text-[11px] font-semibold uppercase tracking-[0.4em] text-rose-500">Para {recipient}</p>}
          {title && <h1 className="break-words font-display text-5xl font-bold tracking-tight text-ink md:text-6xl">{title}</h1>}
          <div className="mx-auto mt-5 flex items-center justify-center gap-3 text-ink/35">
            <span className="h-px w-10 bg-ink/20" />
            <span className="text-[10px] uppercase tracking-[0.3em]">o álbum de nós dois</span>
            <span className="h-px w-10 bg-ink/20" />
          </div>
        </header>

        {/* mosaico */}
        {photos.length > 0 && (
          <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
            {photos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightbox(i)}
                className="group block w-full overflow-hidden rounded-xl ring-1 ring-black/5 shadow-sm"
                style={{ animation: `amorzinPopIn 500ms ease-out ${i * 70}ms both` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full transition-transform duration-500 group-hover:scale-[1.06]" />
              </button>
            ))}
          </div>
        )}
        {photos.length > 0 && (
          <p className="mt-4 text-center text-[11px] uppercase tracking-[0.25em] text-ink/35">toque numa foto para ampliar</p>
        )}

        {message && (
          <p className="mx-auto mt-12 max-w-xl whitespace-pre-line break-words text-center text-lg leading-relaxed text-ink/75">{message}</p>
        )}

        <StorySections sections={props.sections} variant="light" />

        {props.relationshipStart && (
          <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-rose-100 bg-white px-6 py-5 text-center shadow-sm">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-rose-400">Juntos há</p>
            <div className="text-ink [&_.uppercase]:hidden [&_.font-mono]:text-2xl [&_.font-mono]:font-semibold">
              <DateCounter startDate={props.relationshipStart} />
            </div>
          </div>
        )}

        <p className="mt-14 text-center text-[11px] text-ink/40">Feito com 💛 na <a href="/" className="underline underline-offset-2 hover:text-rose-600">Amorzzin</a></p>
      </section>

      {/* lightbox */}
      {lightbox !== null && photos[lightbox] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[lightbox]} alt="" className="max-h-[90svh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          {photos.length > 1 && (
            <>
              <button type="button" aria-label="Anterior"
                onClick={(e) => { e.stopPropagation(); setLightbox((l) => (l! - 1 + photos.length) % photos.length); }}
                className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white backdrop-blur hover:bg-white/25">‹</button>
              <button type="button" aria-label="Próxima"
                onClick={(e) => { e.stopPropagation(); setLightbox((l) => (l! + 1) % photos.length); }}
                className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white backdrop-blur hover:bg-white/25">›</button>
            </>
          )}
          <button type="button" aria-label="Fechar" onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-xl text-white backdrop-blur hover:bg-white/25">✕</button>
        </div>
      )}

      {!started && <OpenOverlay emoji={props.emoji} recipient={recipient ?? null} onOpen={open} />}
      {started && props.musicVideoId && <MusicPlayer videoId={props.musicVideoId} />}

      <style>{`@keyframes amorzinPopIn { 0% { transform: translateY(14px) scale(0.96); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }`}</style>
    </main>
  );
}
