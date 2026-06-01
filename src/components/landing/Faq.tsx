"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

const FAQ_ITEMS = [
  {
    q: "O que é a Amorzin?",
    a: "Uma plataforma pra criar páginas personalizadas pra alguém especial — com fotos, mensagem, música e contador de tempo. Você manda o link e a pessoa abre.",
  },
  {
    q: "Preciso criar conta?",
    a: "Não. Você preenche, paga e recebe o link por e-mail. Sem cadastro, sem senha, sem assinatura.",
  },
  {
    q: "Como recebo a página depois de pagar?",
    a: "Assim que o pagamento for confirmado, mandamos um e-mail com o link público e um QR Code anexado. Pix é instantâneo, cartão também na maioria dos casos.",
  },
  {
    q: "Por quanto tempo a página fica no ar?",
    a: "Depende do plano. O Mensal fica 30 dias. O Anual fica 1 ano completo.",
  },
  {
    q: "Quais formas de pagamento vocês aceitam?",
    a: "Pix e cartão de crédito (parcelado em até 12x). Tudo pelo MercadoPago.",
  },
  {
    q: "Posso colocar uma música?",
    a: "Sim. Cola o link do YouTube e a música toca direto na página.",
  },
  {
    q: "Quantas fotos posso colocar?",
    a: "Até 8 fotos em qualquer plano. JPG, PNG ou WebP, até 5MB cada.",
  },
  {
    q: "Como entro em contato com suporte?",
    a: "Manda no Instagram @Amorzin_ ou responde o e-mail de confirmação.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-rose-700 backdrop-blur">
            ❓ Perguntas frequentes
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
            Ainda em dúvida?
          </h2>
          <p className="mt-4 text-lg text-ink/70 text-balance">
            Se sua pergunta não estiver aqui, fala com a gente.
          </p>
        </div>

        <ul className="mt-12 space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <li
                key={item.q}
                className={cn(
                  "overflow-hidden rounded-2xl border bg-white/70 backdrop-blur transition-colors",
                  isOpen ? "border-rose-300" : "border-rose-100",
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-ink">{item.q}</span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-sm font-bold text-rose-600 transition-transform",
                      isOpen && "rotate-45",
                    )}
                  >
                    +
                  </span>
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink/70">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-10 text-center">
          <a
            href="https://instagram.com/Amorzin_"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700"
          >
            📱 Falar no Instagram @Amorzin_
          </a>
        </div>
      </div>
    </section>
  );
}
