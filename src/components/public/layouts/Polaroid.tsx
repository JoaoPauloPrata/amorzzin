"use client";

import { useState } from "react";
import { DateCounter } from "@/components/wizard/DateCounter";
import { FloatingHearts, OpenOverlay, MusicPlayer, StorySections, useReveal, type LayoutProps } from "../shared";
import { cn } from "@/lib/utils/cn";

export function Polaroid(props: LayoutProps) {
  const { photos, sections } = props;
  const { started, open } = useReveal(props.autoOpen);
  const [idx, setIdx] = useState(0);

  const title = props.title?.trim();
  const recipient = props.recipient?.trim();
  const message = props.message?.trim();
  const hasPhotos = photos.length > 0;

  function next() {
    if (photos.length > 1) setIdx((i) => (i + 1) % photos.length);
  }

  return (
    <main className="relative w-full bg-[#fdeef0] text-ink">
      {/* textura de papel quente */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 40% at 20% 10%, rgba(255,158,180,0.35), transparent 60%), radial-gradient(50% 40% at 90% 30%, rgba(162,107,232,0.20), transparent 60%)" }} />
      <FloatingHearts emoji={props.emoji} subtle />

      <div
        className={cn(
          "relative z-10 mx-auto max-w-md px-6 pb-16 pt-16 transition-all duration-1000",
          started ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-3 opacity-0 blur-sm",
        )}
      >
        <div className="flex min-h-[86svh] flex-col items-center justify-center text-center">
          {recipient && <p className="mb-2 font-hand text-4xl text-rose-500">para {recipient}</p>}

          {hasPhotos && (
            <button type="button" onClick={next} aria-label="Próxima foto" className="relative mb-7 h-[21rem] w-[16.5rem]">
              <span className="absolute inset-0 -rotate-[7deg] rounded-[3px] border border-black/5 bg-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]" />
              <span className="absolute inset-0 rotate-[4deg] rounded-[3px] border border-black/5 bg-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)]" />
              <div key={idx} className="absolute inset-0 rounded-[3px] border border-black/5 bg-white p-3 pb-12 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.5)]" style={{ animation: "amorzinCardIn 600ms ease-out" }}>
                {/* washi tape */}
                <span className="absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-3 rounded-[2px] bg-rose-300/40 shadow-sm backdrop-blur-[1px]" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photos[idx]} alt="" className="h-full w-full rounded-[2px] object-cover" />
                <span className="absolute inset-x-0 bottom-3 text-center font-hand text-2xl text-ink/70">
                  {recipient ? `eu & ${recipient}` : "nós dois"}
                </span>
              </div>
            </button>
          )}
          {photos.length > 1 && <p className="mb-6 -mt-2 text-[11px] uppercase tracking-[0.25em] text-rose-400">{idx + 1} / {photos.length} · toque</p>}

          {/* cartão-bilhete */}
          <div className="w-full -rotate-1 rounded-2xl border border-rose-100 bg-white p-6 text-left shadow-[0_20px_45px_-22px_rgba(214,51,108,0.5)]">
            {title && <h1 className="font-hand text-4xl text-rose-600">{title}</h1>}
            {message && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/75">{message}</p>}
            {props.relationshipStart && (
              <div className="mt-5 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                <span className="font-hand text-2xl text-rose-500">juntos há</span>
                <div className="text-right text-ink [&_.uppercase]:hidden [&_.font-mono]:text-base">
                  <DateCounter startDate={props.relationshipStart} />
                </div>
              </div>
            )}
            <p className="mt-4 text-right font-hand text-2xl text-ink/60">com amor 💛</p>
          </div>
        </div>

        <StorySections sections={sections} variant="light" />

        <p className="mt-10 text-center text-[11px] text-ink/40">Feito com 💛 na <a href="/" className="underline underline-offset-2 hover:text-rose-600">Amorzin</a></p>
      </div>

      {!started && <OpenOverlay emoji={props.emoji} recipient={recipient ?? null} onOpen={open} />}
      {started && props.musicVideoId && <MusicPlayer videoId={props.musicVideoId} />}

      <style>{`@keyframes amorzinCardIn { 0% { transform: translateY(-16px) rotate(-4deg); opacity: 0; } 100% { transform: translateY(0) rotate(0); opacity: 1; } }`}</style>
    </main>
  );
}
