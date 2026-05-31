"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWizardStore } from "@/lib/wizard/store";
import { buildPreviewPayload } from "./preview-payload";

// O iframe roda na largura real da moldura → viewport "de celular" (<768px: md: off,
// 100svh = altura do iframe). SEM transform/scale, então overflow-hidden + rounded
// recortam normal e nada vaza. A barra de scroll fica FORA da moldura (coluna à direita).
const FRAME_W = 284;
const FRAME_H = 587;
const BEZEL   = 10;   // padding da moldura (p-2.5)
const BAR_W   = 6;
const BAR_GAP = 8;

export function PreviewPanel() {
  const draft  = useWizardStore((s) => s.draft);
  const photos = useWizardStore((s) => s.photos);
  const style  = draft.layout_style ?? "immersive";

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [barFrac, setBarFrac] = useState({ size: 1, pos: 0 }); // frações 0..1

  const styleName =
    style === "polaroid"  ? "Polaroid" :
    style === "editorial" ? "Revista"  :
    style === "gallery"   ? "Galeria"  : "Imersivo";

  const payload = buildPreviewPayload(draft, photos);
  const payloadKey = JSON.stringify(payload);

  const win = () => iframeRef.current?.contentWindow ?? null;

  const measure = useCallback(() => {
    const w = win();
    if (!w) return;
    try {
      const scrollH = w.document.documentElement.scrollHeight;
      const clientH = w.innerHeight;
      const max = Math.max(0, scrollH - clientH);
      setBarFrac({ size: Math.min(1, clientH / scrollH), pos: max > 0 ? w.scrollY / max : 0 });
    } catch { /* mesma origem; não deve falhar */ }
  }, []);

  const post = useCallback(() => {
    win()?.postMessage({ type: "amorzin-preview", payload }, "*");
    setTimeout(measure, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey, measure]);

  useEffect(() => { post(); }, [post]);

  useEffect(() => {
    function onMsg(e: MessageEvent) { if (e.data?.type === "amorzin-preview-ready") post(); }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [post]);

  function onLoad() {
    post();
    const w = win();
    if (w) {
      w.addEventListener("scroll", measure, { passive: true });
      setTimeout(measure, 600);
    }
  }

  // barra externa
  const trackH  = FRAME_H;
  const thumbH  = Math.max(30, barFrac.size * trackH);
  const thumbTop = barFrac.pos * (trackH - thumbH);
  const showBar = barFrac.size < 0.999;
  const dragRef = useRef<{ startY: number; startScroll: number } | null>(null);

  function onThumbDown(e: React.PointerEvent) {
    const w = win();
    if (!w) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startScroll: w.scrollY };
  }
  function onThumbMove(e: React.PointerEvent) {
    const d = dragRef.current;
    const w = win();
    if (!d || !w) return;
    const max = Math.max(0, w.document.documentElement.scrollHeight - w.innerHeight);
    const usable = trackH - thumbH;
    const delta = usable > 0 ? ((e.clientY - d.startY) / usable) * max : 0;
    w.scrollTo(0, Math.min(max, Math.max(0, d.startScroll + delta)));
  }
  function onThumbUp(e: React.PointerEvent) {
    dragRef.current = null;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  }

  return (
    <aside className="sticky top-28 hidden md:block">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink/50">
        Pré-visualização · <span className="text-rose-500">{styleName}</span>
      </p>

      <div className="relative mx-auto" style={{ width: FRAME_W + BEZEL * 2 + BAR_GAP + BAR_W }}>
        <div className="absolute -inset-6 right-2 -z-10 rounded-[3rem] bg-gradient-to-br from-rose-200/60 via-lilac-200/60 to-transparent blur-2xl" />

        <div className="flex items-start" style={{ gap: BAR_GAP }}>
          {/* moldura do celular */}
          <div className="rounded-[2.6rem] border border-white/60 bg-white/80 p-2.5 shadow-soft backdrop-blur">
            <div className="relative overflow-hidden rounded-[2.1rem] bg-black" style={{ width: FRAME_W, height: FRAME_H }}>
              {/* notch */}
              <div className="pointer-events-none absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black/80" />
              <iframe
                ref={iframeRef}
                title="Pré-visualização"
                src="/embed/preview"
                onLoad={onLoad}
                className="block h-full w-full border-0"
              />
            </div>
          </div>

          {/* barra de scroll FORA da moldura */}
          <div className="relative shrink-0" style={{ width: BAR_W, height: trackH, marginTop: BEZEL + 2 }}>
            {showBar && (
              <>
                <div className="absolute inset-0 rounded-full bg-rose-200/50" />
                <div
                  role="scrollbar"
                  aria-orientation="vertical"
                  onPointerDown={onThumbDown}
                  onPointerMove={onThumbMove}
                  onPointerUp={onThumbUp}
                  className="absolute left-0 w-full cursor-grab rounded-full bg-rose-400/80 transition-colors hover:bg-rose-500 active:cursor-grabbing"
                  style={{ top: thumbTop, height: thumbH }}
                />
              </>
            )}
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-ink/50" style={{ width: FRAME_W + BEZEL * 2 }}>
          Prévia real · role ou arraste a barra
        </p>
      </div>
    </aside>
  );
}
