"use client";

import { useEffect, useRef, useState } from "react";

import {
  LAYOUT_OPTIONS,
  type LayoutStyle,
  type Section,
  SECTION_MAX,
  SECTION_BODY_LIMIT,
  SECTION_PRESETS,
} from "@/lib/wizard/schemas";
import { useWizardStore } from "@/lib/wizard/store";
import { updatePage } from "@/app/criar/actions";
import { parseYouTubeUrl, type YtSearchResult } from "@/lib/utils/youtube";
import { EXAMPLE_SECTIONS } from "@/lib/wizard/examples";
import { cn } from "@/lib/utils/cn";
import { ExampleButton } from "../ExampleButton";
import { StepNav } from "../StepNav";

// ─── Thumb (mini-mock de cada layout) ────────────────────────────────────────
function Thumb({ id, active }: { id: LayoutStyle; active: boolean }) {
  const base = "relative h-24 w-full overflow-hidden rounded-lg border";
  const ring = active ? "border-rose-400" : "border-ink/10";

  if (id === "immersive") {
    return (
      <div className={cn(base, ring, "bg-gradient-to-b from-rose-400 to-lilac-500")}>
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1">
          <span className="h-2 w-16 rounded bg-white/90" />
          <span className="h-1.5 w-20 rounded bg-white/60" />
        </div>
      </div>
    );
  }
  if (id === "polaroid") {
    return (
      <div className={cn(base, ring, "bg-rose-50")}>
        <div className="absolute left-1/2 top-4 h-12 w-14 -translate-x-1/2 -rotate-6 rounded-sm border border-ink/10 bg-white shadow-sm" />
        <div className="absolute left-1/2 top-3 h-12 w-14 -translate-x-1/2 rotate-3 rounded-sm border border-ink/10 bg-white shadow" />
        <div className="absolute inset-x-0 bottom-2 flex justify-center"><span className="h-1.5 w-16 rounded bg-rose-300" /></div>
      </div>
    );
  }
  if (id === "editorial") {
    return (
      <div className={cn(base, ring, "bg-[#fbf6ef]")}>
        <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-b from-rose-300 to-lilac-300" />
        <div className="absolute right-2 top-3 flex flex-col gap-1">
          <span className="h-2 w-12 rounded-sm bg-ink/70" />
          <span className="h-1 w-14 rounded bg-ink/30" />
          <span className="h-1 w-10 rounded bg-ink/30" />
          <span className="mt-1 h-1 w-12 rounded bg-ink/20" />
        </div>
      </div>
    );
  }
  // gallery
  return (
    <div className={cn(base, ring, "bg-white p-2")}>
      <div className="grid h-full grid-cols-3 grid-rows-2 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="rounded-sm bg-gradient-to-br from-rose-200 to-lilac-200" />
        ))}
      </div>
    </div>
  );
}

function thumbFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/default.jpg`;
}

type SelectedMusic = { videoId: string; title: string; channel: string; thumb: string };

export function StepVisual({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const draft      = useWizardStore((s) => s.draft);
  const pageId     = useWizardStore((s) => s.pageId);
  const editToken  = useWizardStore((s) => s.editToken);
  const patchDraft = useWizardStore((s) => s.patchDraft);

  const [selectedLayout, setSelectedLayout] = useState<LayoutStyle>(draft.layout_style ?? "polaroid");
  // Seções extras vêm pré-preenchidas com um exemplo (a pessoa edita se quiser).
  const [sections, setSections] = useState<Section[]>(
    draft.sections ?? EXAMPLE_SECTIONS[0].map((s) => ({ ...s })),
  );
  const [showPresets, setShowPresets] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  // Sincroniza o exemplo pré-preenchido com o store na 1ª visita (pra preview/save).
  useEffect(() => {
    if (draft.sections === undefined) {
      patchDraft({ sections: EXAMPLE_SECTIONS[0].map((s) => ({ ...s })) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Layout ─────────────────────────────────────────────────────────────────
  async function chooseLayout(id: LayoutStyle) {
    setSelectedLayout(id);
    patchDraft({ layout_style: id });
    if (pageId && editToken) {
      await updatePage({ id: pageId, edit_token: editToken, layout_style: id });
    }
  }

  // ─── Seções ─────────────────────────────────────────────────────────────────
  function syncSections(next: Section[]) {
    setSections(next);
    patchDraft({ sections: next });
  }
  function addSection(preset?: { title: string }) {
    if (sections.length >= SECTION_MAX) return;
    syncSections([...sections, { title: preset?.title ?? "", body: "" }]);
    setShowPresets(false);
  }
  function updateSection(i: number, patch: Partial<Section>) {
    syncSections(sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeSection(i: number) {
    syncSections(sections.filter((_, idx) => idx !== i));
  }
  function applyExampleSections(example: Section[]) {
    // Aplica respeitando o limite máximo.
    syncSections(example.slice(0, SECTION_MAX).map((s) => ({ ...s })));
  }
  const availablePresets = SECTION_PRESETS.filter((p) => !sections.some((s) => s.title === p.title));

  // ─── Música ─────────────────────────────────────────────────────────────────
  const initialMusic = (): SelectedMusic | null => {
    const ref = parseYouTubeUrl(draft.music_embed_url);
    if (!ref) return null;
    return { videoId: ref.videoId, title: "Música selecionada", channel: "YouTube", thumb: thumbFor(ref.videoId) };
  };
  const [selectedMusic, setSelectedMusic] = useState<SelectedMusic | null>(initialMusic);
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<YtSearchResult[]>([]);
  const [open, setOpen]       = useState(false);
  const [searching, setSearching] = useState(false);
  const [musicSaving, setMusicSaving] = useState(false);
  const boxRef   = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }

    const urlRef = parseYouTubeUrl(q);
    if (urlRef) {
      setResults([{ videoId: urlRef.videoId, title: "Usar este link", channel: "Link do YouTube", thumb: thumbFor(urlRef.videoId) }]);
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

  async function pickMusic(item: YtSearchResult) {
    if (!pageId || !editToken) { setSubmitErr("Rascunho perdido. Volta pro primeiro passo."); return; }
    const ref = parseYouTubeUrl(item.videoId);
    if (!ref) return;

    setSelectedMusic({ videoId: item.videoId, title: item.title, channel: item.channel, thumb: item.thumb || thumbFor(item.videoId) });
    setOpen(false);
    setQuery("");
    setResults([]);

    setMusicSaving(true);
    setSubmitErr(null);
    const res = await updatePage({ id: pageId, edit_token: editToken, music_embed_url: ref.embedUrl, music_provider: "youtube" });
    setMusicSaving(false);
    if (!res.ok) { setSubmitErr(res.error); return; }
    patchDraft({ music_embed_url: ref.embedUrl, music_provider: "youtube" });
  }

  async function removeMusic() {
    if (!pageId || !editToken) return;
    setMusicSaving(true);
    setSubmitErr(null);
    const res = await updatePage({ id: pageId, edit_token: editToken, music_embed_url: null, music_provider: null });
    setMusicSaving(false);
    if (!res.ok) { setSubmitErr(res.error); return; }
    setSelectedMusic(null);
    patchDraft({ music_embed_url: null, music_provider: null });
  }

  // ─── Continuar ───────────────────────────────────────────────────────────────
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    if (!pageId || !editToken) { setSubmitErr("Sessão expirou. Volte ao passo 1."); return; }

    const cleaned = sections
      .map((s) => ({ title: s.title.trim(), body: s.body.trim() }))
      .filter((s) => s.title || s.body);

    setSaving(true);
    const res = await updatePage({ id: pageId, edit_token: editToken, layout_style: selectedLayout, sections: cleaned });
    setSaving(false);
    if (!res.ok) { setSubmitErr(res.error); return; }
    setSections(cleaned);
    patchDraft({ layout_style: selectedLayout, sections: cleaned });
    onNext();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <header>
        <h2 className="font-display text-3xl font-bold text-ink md:text-4xl">
          Deixe com a sua cara
        </h2>
        <p className="mt-2 text-ink/70">
          Estilo da página, trilha sonora e seções extras. Tudo opcional — dá pra trocar antes de pagar.
        </p>
      </header>

      {/* ── Estilo ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink/50">Estilo</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LAYOUT_OPTIONS.map((opt) => {
            const active = selectedLayout === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => chooseLayout(opt.id)}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all",
                  active
                    ? "border-rose-400 bg-rose-50/60 shadow-soft ring-1 ring-rose-300"
                    : "border-ink/10 bg-white/70 hover:border-rose-200",
                )}
              >
                <Thumb id={opt.id} active={active} />
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-ink">{opt.nome}</span>
                  {active && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 text-[11px] text-white">✓</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-ink/60">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Música ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-ink/50">Música <span className="font-normal normal-case text-ink/40">(opcional)</span></h3>
        <div ref={boxRef} className="relative">
          <div className="relative">
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
                    onClick={() => pickMusic(item)}
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
        </div>

        {selectedMusic && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedMusic.thumb} alt="" className="h-12 w-20 flex-none rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{selectedMusic.title}</p>
                <p className="truncate text-xs text-ink/50">{selectedMusic.channel}</p>
              </div>
              <button
                type="button"
                onClick={removeMusic}
                disabled={musicSaving}
                className="flex-none rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:text-rose-600 disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Seções extras ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-ink/50">
            Seções extras <span className="font-normal normal-case text-ink/40">({sections.length}/{SECTION_MAX})</span>
          </h3>
          <ExampleButton items={EXAMPLE_SECTIONS} onPick={applyExampleSections} label="Usar exemplo" />
        </div>

        {sections.map((sec, i) => (
          <div key={i} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
            <div className="flex items-center gap-2">
              <input
                value={sec.title}
                onChange={(e) => updateSection(i, { title: e.target.value.slice(0, 60) })}
                placeholder="Título da seção (ex.: Nossa história)"
                className="w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-semibold text-ink outline-none focus:border-rose-400"
              />
              <button
                type="button"
                onClick={() => removeSection(i)}
                aria-label="Remover seção"
                className="flex-none rounded-lg border border-red-200 bg-white p-2 text-red-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                  <path d="M10 11v6M14 11v6" />
                </svg>
              </button>
            </div>
            <textarea
              value={sec.body}
              onChange={(e) => updateSection(i, { body: e.target.value.slice(0, SECTION_BODY_LIMIT) })}
              rows={3}
              placeholder="Escreve o conteúdo dessa seção…"
              className="mt-2 w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-rose-400"
            />
          </div>
        ))}

        {sections.length < SECTION_MAX && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPresets((v) => !v)}
              className="w-full rounded-xl border border-dashed border-rose-300 bg-white/60 px-4 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
            >
              + Adicionar seção
            </button>

            {showPresets && (
              <div className="absolute bottom-full z-[80] mb-2 max-h-72 w-full overflow-auto rounded-xl border border-ink/10 bg-white p-2 shadow-lg">
                {availablePresets.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => addSection(p)}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-rose-50"
                  >
                    {p.title}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => addSection()}
                  className={cn(
                    "block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50",
                    availablePresets.length > 0 && "mt-1 border-t border-ink/5 pt-2",
                  )}
                >
                  ✏️ Seção personalizada
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      <StepNav
        canBack
        isLast={false}
        submitting={saving}
        error={submitErr}
        onBack={onBack}
      />
    </form>
  );
}
