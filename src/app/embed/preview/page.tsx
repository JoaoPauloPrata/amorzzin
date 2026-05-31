"use client";

import { useEffect, useState } from "react";
import { type LayoutProps } from "@/components/public/shared";
import { Immersive } from "@/components/public/layouts/Immersive";
import { Polaroid } from "@/components/public/layouts/Polaroid";
import { Editorial } from "@/components/public/layouts/Editorial";
import { Gallery } from "@/components/public/layouts/Gallery";

export const dynamic = "force-dynamic";

type Payload = LayoutProps & { style: string };

const LAYOUTS = { immersive: Immersive, polaroid: Polaroid, editorial: Editorial, gallery: Gallery } as const;

const INITIAL: Payload = {
  style: "immersive",
  title: "Seu título aparece aqui",
  recipient: null,
  message: "Sua mensagem aparece aqui assim que você digitar…",
  relationshipStart: null,
  photos: [],
  musicVideoId: null,
  emoji: "❤️",
  sections: [],
  autoOpen: true,
};

// Página embutida via iframe no PreviewPanel do wizard. Recebe os dados do rascunho
// por postMessage e renderiza EXATAMENTE o mesmo componente de layout da página real
// (mesmo viewport do iframe → classes md: e 100svh se comportam certo). Música off.
export default function PreviewEmbed() {
  const [data, setData] = useState<Payload>(INITIAL);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "amorzin-preview" && e.data.payload) {
        setData({ ...INITIAL, ...e.data.payload, musicVideoId: null, autoOpen: true });
      }
    }
    window.addEventListener("message", onMsg);
    // avisa o pai que está pronto pra receber o primeiro payload
    window.parent?.postMessage({ type: "amorzin-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const Layout = LAYOUTS[data.style as keyof typeof LAYOUTS] ?? Immersive;
  return (
    <>
      {/* rola por dentro, mas SEM barra nativa — a barra visível fica fora da moldura
          (desenhada pelo PreviewPanel) pra não interferir no recorte do celular */}
      <style>{`
        html { overflow-y: auto; scrollbar-width: none; }
        ::-webkit-scrollbar { width: 0; height: 0; display: none; }
      `}</style>
      <Layout {...data} />
    </>
  );
}

