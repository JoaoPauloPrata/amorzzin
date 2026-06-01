import Link from "next/link";
import { TypingRotator } from "./TypingRotator";
import { PhoneMockup } from "./PhoneMockup";

const ROTATING_PHRASES = [
  "para quem você ama",
  "para seu namorado",
  "para sua namorada",
  "para sua mãe",
  "para seu melhor amigo",
];

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-rose-700 backdrop-blur">
            💌 Vamos começar?
          </span>

          <h1 className="mt-5 font-display text-5xl font-bold leading-[1.05] text-ink md:text-6xl">
            Declare seu amor
            {/* texto acessível estável; a versão animada abaixo é aria-hidden */}
            <span className="sr-only"> para quem você ama</span>
            <br />
            {/* min-h reserva 2 linhas → sem layout shift quando a frase longa quebra */}
            <span className="gradient-text inline-block min-h-[2.1em] align-top">
              <TypingRotator phrases={ROTATING_PHRASES} />
            </span>
          </h1>

          <p className="mt-6 max-w-md text-lg text-ink/70 text-balance">
            Em 5 minutos você cria uma página com fotos, música e mensagem. Manda o link no WhatsApp e surpreende quem você ama.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/criar"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-7 py-3.5 text-base font-semibold text-white shadow-soft transition-transform hover:scale-[1.03]"
            >
              <span>💖</span>
              Criar minha página
              <span className="transition-transform group-hover:translate-x-1">›</span>
            </Link>
            <a
              href="#como-funciona"
              className="text-sm font-medium text-ink/70 underline-offset-4 hover:underline"
            >
              Como funciona?
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-2 text-xs font-medium text-ink/70">
            <li className="rounded-full border border-rose-200 bg-white/60 px-3 py-1.5">
              Pix instantâneo
            </li>
            <li className="rounded-full border border-rose-200 bg-white/60 px-3 py-1.5">
              Sem cadastro
            </li>
            <li className="rounded-full border border-rose-200 bg-white/60 px-3 py-1.5">
              Link + QR Code por e-mail
            </li>
          </ul>
        </div>

        <div className="animate-fade-up md:[animation-delay:120ms]">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
