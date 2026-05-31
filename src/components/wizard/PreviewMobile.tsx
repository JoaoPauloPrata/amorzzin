"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWizardStore } from "@/lib/wizard/store";
import { buildPreviewPayload } from "./preview-payload";

// Mobile-only: botão flutuante "Ver prévia" abre o preview em tela cheia (o viewport
// real do celular já renderiza o layout exato, rolável). O botão vira "Voltar a editar".
export function PreviewMobile() {
  const draft  = useWizardStore((s) => s.draft);
  const photos = useWizardStore((s) => s.photos);

  const [open, setOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const payload = buildPreviewPayload(draft, photos);
  const payloadKey = JSON.stringify(payload);

  const post = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "amorzin-preview", payload }, "*");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey]);

  useEffect(() => { if (open) post(); }, [open, post]);

  useEffect(() => {
    function onMsg(e: MessageEvent) { if (e.data?.type === "amorzin-preview-ready") post(); }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [post]);

  // trava o scroll do body enquanto a prévia está aberta
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <div className="md:hidden">
      {open && (
        <div className="fixed inset-0 bg-black" style={{ zIndex: 60 }}>
          <iframe
            ref={iframeRef}
            title="Prévia"
            src="/embed/preview"
            onLoad={post}
            className="h-full w-full border-0"
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(214,51,108,0.6)] transition-transform active:scale-95"
        style={{ zIndex: 70, marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {open ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
            Voltar a editar
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
            Ver prévia
          </>
        )}
      </button>
    </div>
  );
}
