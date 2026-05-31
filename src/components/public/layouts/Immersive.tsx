"use client";

import { useEffect, useState } from "react";
import { DateCounter } from "@/components/wizard/DateCounter";
import { cn } from "@/lib/utils/cn";
import { FloatingHearts, OpenOverlay, MusicPlayer, StorySections, useReveal, type LayoutProps } from "../shared";

export function Immersive(props: LayoutProps) {
  const { photos, sections } = props;
  const { started, open } = useReveal(props.autoOpen);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!started || photos.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % photos.length), 4500);
    return () => clearInterval(t);
  }, [started, photos.length]);

  const title = props.title?.trim();
  const recipient = props.recipient?.trim();
  const message = props.message?.trim();
  const hasSections = sections.length > 0;

  return (
    <main className="relative w-full bg-[#160a14] text-white">
      <FloatingHearts emoji={props.emoji} />

      {/* hero — tela cheia com foto no fundo */}
      <div className="relative min-h-[100svh] w-full overflow-hidden">
        <div className="absolute inset-0">
          {photos.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              aria-hidden
              className={cn("absolute inset-0 h-full w-full object-cover", i === slide ? "scale-110 opacity-100" : "scale-100 opacity-0")}
              style={{ transition: "opacity 1.6s ease-in-out, transform 7s ease-out" }}
            />
          ))}
          {/* gradiente quente + vinheta cinematográfica */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#160a14]/30 via-[#160a14]/10 to-[#160a14]/90" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(115% 75% at 50% 32%, transparent 42%, rgba(22,10,20,0.62) 100%)" }} />
        </div>

        <section
          className={cn(
            "relative z-10 mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center px-7 py-16 text-center transition-all duration-[1200ms]",
            started ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-3 opacity-0 blur-sm",
          )}
        >
          <span className="mb-6 flex gap-1.5" aria-hidden>
            <i className="h-1.5 w-1.5 rounded-full bg-rose-400" />
            <i className="h-1.5 w-1.5 rounded-full bg-rose-300/70" />
            <i className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          </span>

          {recipient && <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.45em] text-white/75">Para {recipient}</p>}
          {title && (
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)] md:text-6xl">
              {title}
            </h1>
          )}
          <span className="mt-5 h-px w-16 bg-gradient-to-r from-transparent via-rose-300 to-transparent" />

          {message && <p className="mt-7 whitespace-pre-line text-[15px] leading-relaxed text-white/90 drop-shadow md:text-base">{message}</p>}

          {props.relationshipStart && (
            <div className="mt-9 w-full rounded-2xl border border-white/20 bg-white/[0.07] px-5 py-4 backdrop-blur-md">
              <DateCounter startDate={props.relationshipStart} />
            </div>
          )}

          {photos.length > 1 && (
            <div className="mt-8 flex justify-center gap-1.5">
              {photos.map((url, i) => (
                <button key={url} type="button" aria-label={`Foto ${i + 1}`} onClick={() => setSlide(i)}
                  className={cn("h-1 rounded-full transition-all duration-500", i === slide ? "w-7 bg-rose-300" : "w-1.5 bg-white/40")} />
              ))}
            </div>
          )}
          {started && hasSections && <p className="mt-12 text-[11px] uppercase tracking-[0.3em] text-white/50">role para ver mais ↓</p>}
        </section>
      </div>

      {/* seções extras + rodapé */}
      {started && (
        <div className="relative z-10 mx-auto max-w-md px-7 pb-20">
          <StorySections sections={sections} variant="dark" />
          <p className="mt-14 text-center text-[11px] text-white/50">Feito com 💛 na <a href="/" className="underline underline-offset-2 hover:text-white">Amorzin</a></p>
        </div>
      )}

      {!started && <OpenOverlay emoji={props.emoji} recipient={recipient ?? null} onOpen={open} />}
      {started && props.musicVideoId && <MusicPlayer videoId={props.musicVideoId} />}
    </main>
  );
}
