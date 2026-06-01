import type { LayoutProps } from "@/components/public/shared";

// Ordem de exibição na vitrine: Polaroid → Revista → Galeria → Imersão.
export const EXAMPLE_STYLES = ["polaroid", "editorial", "gallery", "immersive"] as const;
export type ExampleStyle = (typeof EXAMPLE_STYLES)[number];

export const EXAMPLE_STYLE_LABELS: Record<ExampleStyle, string> = {
  polaroid:  "Polaroid",
  editorial: "Revista",
  gallery:   "Galeria",
  immersive: "Imersivo",
};

// Fotos de exemplo reais (public/exemplos, otimizadas pra WebP).
export const EXAMPLE_PHOTOS = [
  "/exemplos/exemplo-1.webp",
  "/exemplos/exemplo-2.webp",
  "/exemplos/exemplo-3.webp",
  "/exemplos/exemplo-4.webp",
  "/exemplos/exemplo-5.webp",
  "/exemplos/exemplo-6.webp",
  "/exemplos/exemplo-7.webp",
];

// Conteúdo fake usado tanto na vitrine pública (/exemplos) quanto no preview dev.
export const EXAMPLE_PAGE: LayoutProps = {
  title:             "Eu te amo",
  recipient:         "Maria Luisa",
  message:           "Desde o dia em que te conheci, tudo ficou mais leve.\nObrigado por ser meu lugar favorito no mundo. 💛",
  relationshipStart: "2021-06-12",
  photos:            EXAMPLE_PHOTOS,
  musicVideoId:      null,
  emoji:             "❤️",
  autoOpen:          true,
  sections: [
    { title: "Nossa história", body: "Começou num café chuvoso de terça. Você atrasou 20 minutos e mesmo assim foi o melhor encontro da minha vida." },
    { title: "O que mais amo em você", body: "Seu jeito de rir alto sem se importar com quem está olhando. Sua coragem. O jeito que você me olha quando acha que eu não tô vendo." },
    { title: "Nossos sonhos", body: "Uma casa com varanda, um cachorro chamado Pão, e mil viagens de mãos dadas. Tudo com você." },
  ],
};
