"use client";

import { useWizardStore } from "@/lib/wizard/store";
import { DateCounter } from "./DateCounter";
import { cn } from "@/lib/utils/cn";

export function PreviewPanel() {
  const draft  = useWizardStore((s) => s.draft);
  const photos = useWizardStore((s) => s.photos);

  const title     = draft.title?.trim()          || "Seu título aparece aqui";
  const recipient = draft.recipient_name?.trim();
  const message   = draft.message?.trim()        || "Sua mensagem aparece aqui assim que você digitar…";

  const cover    = photos[0];
  const hasCover = Boolean(cover);

  return (
    <aside className="sticky top-28 hidden md:block">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/50">
        Pré-visualização
      </p>

      <div className="relative mx-auto w-full max-w-[320px]">
        <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-rose-200/60 via-lilac-200/60 to-transparent blur-2xl" />
        <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-3 shadow-soft backdrop-blur">
          <div
            className={cn(
              "relative aspect-[9/19] overflow-hidden rounded-[2rem] text-white",
              !hasCover && "bg-gradient-to-b from-rose-500 via-rose-400 to-lilac-500",
            )}
          >
            {hasCover && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover.url}
                  alt="Capa"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/35 to-black/70" />
              </>
            )}

            <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black/70" />

            {draft.music_embed_url && (
              <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur">
                <span className="animate-pulse">🎵</span>
                <span>com música</span>
              </div>
            )}

            <div className="relative flex h-full flex-col p-5 pt-10">
              {recipient && (
                <p className="text-center text-[10px] uppercase tracking-widest text-white/70">
                  Para {recipient}
                </p>
              )}
              <h3 className="mt-1 text-center font-display text-2xl leading-tight drop-shadow-sm">
                {title}
              </h3>

              <p className="mt-4 line-clamp-6 px-1 text-center text-sm leading-snug text-white/90 drop-shadow-sm">
                {message}
              </p>

              {photos.length > 1 && (
                <div className="mt-3 flex justify-center gap-1">
                  {photos.map((p, i) => (
                    <span
                      key={p.id}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        i === 0 ? "w-4 bg-white" : "w-1.5 bg-white/50",
                      )}
                    />
                  ))}
                </div>
              )}

              <div className="mt-auto rounded-xl bg-white/15 p-3 text-center backdrop-blur">
                <DateCounter startDate={draft.relationship_start} />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-ink/50">
          Visual final pode variar conforme estilo do carrossel.
        </p>
      </div>
    </aside>
  );
}
