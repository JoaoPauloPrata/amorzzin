"use client";

import { useEffect, useRef, useState } from "react";

import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { parseYouTubeUrl, type YtSearchResult } from "@/lib/utils/youtube";
import { StepNav } from "../StepNav";

type Selected = {
  videoId: string;
  title:   string;
  channel: string;
  thumb:   string;
};

function thumbFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/default.jpg`;
}

export function Step5Music({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft      = useWizardStore((s) => s.draft);
  const pageId     = useWizardStore((s) => s.pageId);
  const editToken  = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  // Seleção atual — inicializa do que já está salvo no rascunho.
  const initialSelected = (): Selected | null => {
    const ref = parseYouTubeUrl(draft.music_embed_url);
    if (!ref) return null;
    return { videoId: ref.videoId, title: "Música selecionada", channel: "YouTube", thumb: thumbFor(ref.videoId) };
  };

  const [selected, setSelected] = useState<Selected | null>(initialSelected);
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<YtSearchResult[]>([]);
  const [open, setOpen]         = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const boxRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fecha dropdown ao clicar fora.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Busca debounced conforme digita.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    // Se colou um link do YouTube, oferece seleção direta (sem gastar quota da API).
    const urlRef = parseYouTubeUrl(q);
    if (urlRef) {
      setResults([
        { videoId: urlRef.videoId, title: "Usar este link", channel: "Link do YouTube", thumb: thumbFor(urlRef.videoId) },
      ]);
      setSearching(false);
      setOpen(true);
      return;
    }

    setSearching(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const r = await fetch(`/api/yt-search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = await r.json();
        if (!r.ok) {
          setResults([]);
          setSubmitErr(data?.error === "search not configured" ? "Busca de música não configurada (falta YOUTUBE_API_KEY)." : null);
        } else {
          setResults(data.results ?? []);
          setSubmitErr(null);
        }
        setOpen(true);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);

    return () => clearTimeout(t);
  }, [query]);

  async function pick(item: YtSearchResult) {
    if (!pageId || !editToken) {
      setSubmitErr("Rascunho perdido. Volta pro primeiro passo.");
      return;
    }
    const ref = parseYouTubeUrl(item.videoId);
    if (!ref) return;

    setSelected({ videoId: item.videoId, title: item.title, channel: item.channel, thumb: item.thumb || thumbFor(item.videoId) });
    setOpen(false);
    setQuery("");
    setResults([]);

    setSaving(true);
    setSubmitErr(null);
    const res = await updatePage({
      id: pageId,
      edit_token: editToken,
      music_embed_url: ref.embedUrl,
      music_provider:  "youtube",
    });
    setSaving(false);
    if (!res.ok) { setSubmitErr(res.error); return; }
    patchDraft({ music_embed_url: ref.embedUrl, music_provider: "youtube" });
  }

  async function removeMusic() {
    if (!pageId || !editToken) return;
    setSaving(true);
    setSubmitErr(null);
    const res = await updatePage({
      id: pageId,
      edit_token: editToken,
      music_embed_url: null,
      music_provider:  null,
    });
    setSaving(false);
    if (!res.ok) { setSubmitErr(res.error); return; }
    setSelected(null);
    patchDraft({ music_embed_url: null, music_provider: null });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Qual a trilha sonora?
        </h2>
        <p className="mt-2 text-ink/70">
          Pesquise uma música do <span className="font-semibold">YouTube</span> e clique pra selecionar. Ela toca de fundo na página. Esse passo é opcional.
        </p>
      </header>

      {/* busca + dropdown */}
      <div ref={boxRef} className="relative">
        <label className="text-sm font-medium text-ink/80">Pesquisar música</label>
        <div className="relative mt-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Ex.: Evidências — Chitãozinho & Xororó"
            className="w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 pr-10 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-rose-400 border-t-transparent" />
            </span>
          )}
        </div>

        {open && results.length > 0 && (
          <ul className="absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-ink/10 bg-white shadow-lg">
            {results.map((item) => (
              <li key={item.videoId}>
                <button
                  type="button"
                  onClick={() => pick(item)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-rose-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumb || thumbFor(item.videoId)} alt="" className="h-10 w-16 flex-none rounded object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-ink">{item.title}</span>
                    <span className="block truncate text-xs text-ink/50">{item.channel}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && !searching && query.trim().length >= 2 && results.length === 0 && (
          <div className="absolute z-20 mt-2 w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm text-ink/50 shadow-lg">
            Nenhum resultado. Tenta outro termo ou cola o link do YouTube.
          </div>
        )}

        <p className="mt-2 text-xs text-ink/50">
          Também vale colar o link direto: <code className="font-mono">youtu.be/…</code> ou <code className="font-mono">/watch?v=…</code>.
        </p>
      </div>

      {/* música selecionada + preview */}
      {selected && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.thumb} alt="" className="h-12 w-20 flex-none rounded object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{selected.title}</p>
              <p className="truncate text-xs text-ink/50">{selected.channel}</p>
            </div>
            <button
              type="button"
              onClick={removeMusic}
              disabled={saving}
              className="flex-none rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:text-rose-600 disabled:opacity-50"
            >
              Remover
            </button>
          </div>

          <div className="relative mt-3 aspect-video overflow-hidden rounded-lg border border-ink/10 bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${selected.videoId}?rel=0`}
              title="Pré-visualização da música"
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <p className="mt-2 text-xs text-ink/50">
            Na página final, o áudio inicia depois do primeiro toque do destinatário (regra dos navegadores).
          </p>
        </div>
      )}

      <StepNav
        canBack={true}
        isLast={false}
        submitting={saving}
        error={submitErr}
        onBack={onBack}
      />
    </form>
  );
}
