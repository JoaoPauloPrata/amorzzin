"use client";

import { useEffect, useMemo, useState } from "react";
import { DateCounter } from "@/components/wizard/DateCounter";
import { cn } from "@/lib/utils/cn";

type Props = {
  title:                string | null;
  recipient:            string | null;
  message:              string | null;
  relationshipStart:    string | null;
  photos:               string[];
  musicVideoId:         string | null;
  animationType:        string | null;
  animationCustomEmoji: string | null;
  carouselStyle:        string | null;
};

function animationEmoji(type: string | null, custom: string | null): string {
  switch (type) {
    case "heart_eyes": return "😍";
    case "custom":     return (custom?.trim() || "💛");
    case "hearts":
    default:           return "❤️";
  }
}

// Corações flutuantes — posições/tempos fixos por índice (sem Math.random no SSR; só client).
function useFloaters(count: number) {
  return useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id:       i,
        left:     (i * 37 + 11) % 100,            // espalha horizontalmente
        delay:    (i * 0.7) % 6,                   // s
        duration: 7 + ((i * 13) % 8),              // 7–14s
        scale:    0.7 + ((i * 17) % 10) / 10,      // 0.7–1.6
        opacity:  0.35 + ((i * 7) % 5) / 10,       // 0.35–0.75
      })),
    [count],
  );
}

export function PublicPage(props: Props) {
  const { photos, musicVideoId } = props;
  const emoji = animationEmoji(props.animationType, props.animationCustomEmoji);
  const floaters = useFloaters(14);

  const [started, setStarted] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [slide, setSlide] = useState(0);

  // Carrossel automático (cross-fade) — só roda após abrir e com 2+ fotos.
  useEffect(() => {
    if (!started || photos.length < 2) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % photos.length), 4500);
    return () => clearInterval(t);
  }, [started, photos.length]);

  const title     = props.title?.trim();
  const recipient = props.recipient?.trim();
  const message   = props.message?.trim();

  return (
    <main className="relative min-h-[100svh] w-full overflow-hidden bg-gradient-to-b from-rose-500 via-rose-400 to-lilac-500 text-white">
      {/* fundo: fotos em cross-fade */}
      <div className="absolute inset-0">
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt=""
            aria-hidden
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1500ms] ease-in-out",
              i === slide ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
        {photos.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/45 to-black/75" />
        )}
      </div>

      {/* corações flutuantes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {floaters.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-[-10%] animate-[floatUp_linear_infinite] select-none"
            style={{
              left:              `${f.left}%`,
              animationDelay:    `${f.delay}s`,
              animationDuration: `${f.duration}s`,
              fontSize:          `${f.scale * 1.8}rem`,
              opacity:           f.opacity,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      {/* conteúdo */}
      <section
        className={cn(
          "relative z-10 mx-auto flex min-h-[100svh] max-w-md flex-col items-center justify-center px-6 py-16 text-center transition-all duration-1000",
          started ? "opacity-100 blur-0" : "pointer-events-none opacity-0 blur-sm",
        )}
      >
        {recipient && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/80 drop-shadow">
            Para {recipient}
          </p>
        )}

        {title && (
          <h1 className="font-display text-4xl font-bold leading-tight drop-shadow-lg md:text-5xl">
            {title}
          </h1>
        )}

        {message && (
          <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-white/95 drop-shadow md:text-lg">
            {message}
          </p>
        )}

        {props.relationshipStart && (
          <div className="mt-8 w-full rounded-2xl bg-white/15 p-5 backdrop-blur-md">
            <DateCounter startDate={props.relationshipStart} />
          </div>
        )}

        {/* indicadores do carrossel */}
        {photos.length > 1 && (
          <div className="mt-8 flex justify-center gap-1.5">
            {photos.map((url, i) => (
              <button
                key={url}
                type="button"
                aria-label={`Foto ${i + 1}`}
                onClick={() => setSlide(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === slide ? "w-6 bg-white" : "w-1.5 bg-white/50",
                )}
              />
            ))}
          </div>
        )}

        <p className="mt-12 text-[11px] text-white/60">
          Feito com 💛 na{" "}
          <a href="/" className="underline underline-offset-2 hover:text-white">
            Amorzin
          </a>
        </p>
      </section>

      {/* overlay de abertura (gesto do usuário → habilita áudio) */}
      {!started && (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-rose-500 via-rose-400 to-lilac-500 px-6 text-center"
        >
          <span className="animate-[floatUp_linear_infinite] text-6xl" style={{ animationDuration: "3s" }}>
            {emoji}
          </span>
          <div>
            <p className="font-display text-3xl font-bold drop-shadow">Uma surpresa pra você</p>
            {recipient && <p className="mt-1 text-white/80">{recipient}, toque para abrir</p>}
          </div>
          <span className="rounded-full bg-white/20 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/30">
            Toque para abrir 💌
          </span>
        </button>
      )}

      {/* música YouTube — só monta após abrir; oculta e em loop */}
      {started && musicVideoId && musicOn && (
        <iframe
          title="Trilha sonora"
          src={`https://www.youtube-nocookie.com/embed/${musicVideoId}?autoplay=1&loop=1&playlist=${musicVideoId}&controls=0&playsinline=1&rel=0`}
          allow="autoplay; encrypted-media"
          className="pointer-events-none fixed bottom-0 right-0 h-px w-px opacity-0"
          aria-hidden
        />
      )}

      {/* botão mute/play */}
      {started && musicVideoId && (
        <button
          type="button"
          onClick={() => setMusicOn((m) => !m)}
          aria-label={musicOn ? "Pausar música" : "Tocar música"}
          className="fixed bottom-5 right-5 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-lg backdrop-blur transition-colors hover:bg-white/30"
        >
          {musicOn ? "🔊" : "🔇"}
        </button>
      )}

      {/* keyframes locais */}
      <style>{`
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);    opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-115svh) scale(1.1); opacity: 0; }
        }
      `}</style>
    </main>
  );
}
