"use client";

import { DateCounter } from "@/components/wizard/DateCounter";
import { OpenOverlay, MusicPlayer, Reveal, useReveal, type LayoutProps } from "../shared";
import { cn } from "@/lib/utils/cn";

export function Editorial(props: LayoutProps) {
  const { photos, sections } = props;
  const { started, open } = useReveal(props.autoOpen);
  const title = props.title?.trim();
  const recipient = props.recipient?.trim();
  const message = props.message?.trim();

  const cover = photos[0];
  const rest = photos.slice(1);

  return (
    <main className={cn("relative min-h-[100svh] w-full overflow-x-hidden bg-[#f7f0e6] font-serif text-ink transition-opacity duration-1000", started ? "opacity-100" : "opacity-0")}>
      {/* capa */}
      <header className="relative flex h-[88svh] items-end overflow-hidden">
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-lilac-500" />
        )}
        <div className="relative z-10 w-full px-7 pb-14 text-cream">
          <p className="mb-3 max-w-full break-words font-sans text-[11px] font-semibold uppercase tracking-[0.4em] text-cream/75">
            {recipient ? `Uma carta para ${recipient}` : "Uma carta"}
          </p>
          {title && (
            <h1 className="break-words font-serif text-6xl font-light italic leading-[0.95] drop-shadow-md md:text-8xl">
              {title}
            </h1>
          )}
          <span className="mt-5 block h-px w-24 bg-rose-300" />
        </div>
      </header>

      <article className="mx-auto max-w-2xl px-7 py-20">
        {/* mensagem com capitular */}
        {message && (
          <Reveal>
            <p className="whitespace-pre-line break-words text-pretty text-2xl leading-relaxed text-ink/85 first-letter:float-left first-letter:mr-3 first-letter:font-serif first-letter:text-7xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-rose-500 md:text-[1.7rem]">
              {message}
            </p>
          </Reveal>
        )}

        {/* contador — moldura discreta editorial */}
        {props.relationshipStart && (
          <Reveal className="mt-16">
            <div className="border-y border-ink/15 py-8 text-center">
              <p className="mb-3 font-sans text-[11px] font-semibold uppercase tracking-[0.4em] text-ink/40">Juntos há</p>
              <div className="text-ink [&_.font-mono]:font-serif [&_.font-mono]:text-3xl [&_.font-mono]:font-semibold [&_.uppercase]:hidden">
                <DateCounter startDate={props.relationshipStart} />
              </div>
            </div>
          </Reveal>
        )}

        {/* seções numeradas, estilo revista */}
        {sections.map((s, i) => (
          <Reveal key={i} className="mt-16">
            <div className="flex items-baseline gap-3">
              <span className="font-sans text-sm font-bold tracking-widest text-rose-400">{String(i + 1).padStart(2, "0")}</span>
              <span className="h-px flex-1 translate-y-[-4px] bg-ink/15" />
            </div>
            {s.title && <h2 className="mt-3 break-words font-serif text-3xl font-medium italic text-ink md:text-4xl">{s.title}</h2>}
            <p className="mt-4 whitespace-pre-line break-words text-lg leading-relaxed text-ink/80">{s.body}</p>
          </Reveal>
        ))}

        {/* fotos alternando, com legenda */}
        {rest.map((url, i) => (
          <Reveal key={url} className="mt-16">
            <figure className={cn(i % 2 === 0 ? "md:-mx-10" : "md:-mx-10")}>
              <div className="overflow-hidden rounded-sm shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="aspect-[4/5] w-full object-cover transition-transform duration-[1.2s] hover:scale-[1.04]" />
              </div>
              <figcaption className="mt-3 text-center font-sans text-[11px] uppercase tracking-[0.3em] text-ink/40">
                — {String(i + 2).padStart(2, "0")} —
              </figcaption>
            </figure>
          </Reveal>
        ))}

        <p className="mt-24 text-center font-sans text-xs text-ink/40">Feito com 💛 na <a href="/" className="underline underline-offset-2 hover:text-rose-600">Amorzin</a></p>
      </article>

      {!started && <OpenOverlay emoji={props.emoji} recipient={recipient ?? null} onOpen={open} />}
      {started && props.musicVideoId && <MusicPlayer videoId={props.musicVideoId} />}
    </main>
  );
}
