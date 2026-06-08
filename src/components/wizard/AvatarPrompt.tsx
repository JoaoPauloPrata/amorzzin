"use client";

import { useEffect, useState } from "react";

// Efeito máquina de escrever — revela o texto char a char. Reinicia se o texto muda.
function useTypewriter(text: string, speed = 26) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setOut("");
    setDone(false);
    if (!text) { setDone(true); return; }
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { out, done };
}

// Cupido (vídeo) + balão de fala. Mobile: coluna (balão abaixo). Web: linha (balão ao lado).
export function AvatarPrompt({ text }: { text: string }) {
  const { out, done } = useTypewriter(text);

  return (
    <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:gap-5">
      {/* avatar — cupido voando */}
      <div className="flex-none">
        <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-rose-100 to-lilac-100 shadow-soft md:h-28 md:w-28">
          <video
            src="/cupido-voando.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* balão */}
      <div className="relative w-full rounded-2xl border border-rose-100 bg-white/85 px-5 py-4 shadow-sm md:mt-3">
        {/* rabicho — mobile: topo (aponta pro avatar acima) */}
        <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-rose-100 bg-white/85 md:hidden" />
        {/* rabicho — web: esquerda (aponta pro avatar ao lado) */}
        <span className="absolute -left-1.5 top-7 hidden h-3 w-3 rotate-45 border-b border-l border-rose-100 bg-white/85 md:block" />

        <p className="min-h-[3.5rem] text-base leading-relaxed text-ink md:min-h-[4rem] md:text-lg">
          {out}
          <span
            className={`ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[2px] bg-rose-400 ${done ? "opacity-0" : "animate-pulse"}`}
            aria-hidden
          />
        </p>
      </div>
    </div>
  );
}
