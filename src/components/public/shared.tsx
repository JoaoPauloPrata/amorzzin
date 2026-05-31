"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export type Section = { title: string; body: string };

// Bloco que faz fade-up ao entrar na viewport.
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cn("transition-all duration-700", shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0", className)}>
      {children}
    </div>
  );
}

// Renderiza as seções extras como blocos revelados no scroll.
export function StorySections({ sections, variant }: { sections: Section[]; variant: "dark" | "light" }) {
  if (!sections || sections.length === 0) return null;
  const dark = variant === "dark";
  return (
    <div className="mt-10 space-y-8">
      {sections.map((s, i) => (
        <Reveal key={i}>
          <div className={cn(
            "rounded-2xl p-6 text-left",
            dark ? "bg-white/10 backdrop-blur-md" : "border border-rose-100 bg-white/80 shadow-soft",
          )}>
            {s.title && (
              <h3 className={cn("mb-2 text-xs font-bold uppercase tracking-[0.2em]", dark ? "text-white/80" : "text-rose-500")}>
                {s.title}
              </h3>
            )}
            <p className={cn("whitespace-pre-line text-base leading-relaxed", dark ? "text-white/90" : "text-ink/80")}>
              {s.body}
            </p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

export function animationEmoji(type: string | null, custom: string | null): string {
  switch (type) {
    case "heart_eyes": return "😍";
    case "custom":     return custom?.trim() || "💛";
    case "hearts":
    default:           return "❤️";
  }
}

// Corações flutuantes — posições/tempos determinísticos por índice (sem random no SSR).
export function FloatingHearts({ emoji, count = 14, subtle = false }: { emoji: string; count?: number; subtle?: boolean }) {
  const floaters = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id:       i,
        left:     (i * 37 + 11) % 100,
        delay:    (i * 0.7) % 6,
        duration: 7 + ((i * 13) % 8),
        scale:    0.7 + ((i * 17) % 10) / 10,
        opacity:  (subtle ? 0.18 : 0.4) + ((i * 7) % 4) / 10,
      })),
    [count, subtle],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {floaters.map((f) => (
        <span
          key={f.id}
          className="absolute bottom-[-10%] select-none"
          style={{
            left:              `${f.left}%`,
            animation:         `amorzinFloatUp ${f.duration}s linear ${f.delay}s infinite`,
            fontSize:          `${f.scale * 1.8}rem`,
            opacity:           f.opacity,
          }}
        >
          {emoji}
        </span>
      ))}
      <style>{`
        @keyframes amorzinFloatUp {
          0%   { transform: translateY(0) scale(1);     opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-115svh) scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Overlay de abertura — captura o gesto do usuário (libera áudio) antes de revelar.
export function OpenOverlay({ emoji, recipient, onOpen }: { emoji: string; recipient: string | null; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-rose-500 via-rose-400 to-lilac-500 px-6 text-center text-white"
    >
      <span className="text-6xl" style={{ animation: "amorzinFloatUp 3s linear infinite" }}>{emoji}</span>
      <div>
        <p className="font-display text-3xl font-bold drop-shadow">Uma surpresa pra você</p>
        {recipient && <p className="mt-1 text-white/80">{recipient}, toque para abrir</p>}
      </div>
      <span className="rounded-full bg-white/20 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/30">
        Toque para abrir 💌
      </span>
    </button>
  );
}

// Música YouTube oculta (loop) + botão mute. Só monta depois de aberto.
export function MusicPlayer({ videoId }: { videoId: string }) {
  const [on, setOn] = useState(true);
  return (
    <>
      {on && (
        <iframe
          title="Trilha sonora"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&playsinline=1&rel=0`}
          allow="autoplay; encrypted-media"
          className="pointer-events-none fixed bottom-0 right-0 h-px w-px opacity-0"
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={() => setOn((m) => !m)}
        aria-label={on ? "Pausar música" : "Tocar música"}
        className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-lg text-white backdrop-blur transition-colors hover:bg-black/45"
      >
        {on ? "🔊" : "🔇"}
      </button>
    </>
  );
}

// Hook simples de "abertura". `initial=true` pula o overlay (usado no preview dev).
export function useReveal(initial = false) {
  const [started, setStarted] = useState(initial);
  return { started, open: () => setStarted(true) };
}

export type LayoutProps = {
  title:             string | null;
  recipient:         string | null;
  message:           string | null;
  relationshipStart: string | null;
  photos:            string[];
  musicVideoId:      string | null;
  emoji:             string;
  sections:          Section[];
  autoOpen?:         boolean;   // pula o overlay (preview dev)
};
