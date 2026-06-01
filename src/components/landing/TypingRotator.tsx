"use client";

import { useEffect, useState } from "react";

type Props = {
  phrases: string[];
  typeMs?: number;
  deleteMs?: number;
  holdMs?: number;
  className?: string;
};

export function TypingRotator({
  phrases,
  typeMs = 80,
  deleteMs = 40,
  holdMs = 1600,
  className,
}: Props) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [animate, setAnimate] = useState(true);

  // Respeita prefers-reduced-motion: sem digitação, mostra a 1ª frase estática.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setAnimate(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!animate) return;
    const current = phrases[index];
    let timer: ReturnType<typeof setTimeout>;

    if (!deleting && shown === current) {
      timer = setTimeout(() => setDeleting(true), holdMs);
    } else if (deleting && shown === "") {
      setDeleting(false);
      setIndex((i) => (i + 1) % phrases.length);
    } else {
      const next = deleting
        ? shown.slice(0, -1)
        : current.slice(0, shown.length + 1);
      timer = setTimeout(() => setShown(next), deleting ? deleteMs : typeMs);
    }

    return () => clearTimeout(timer);
  }, [shown, deleting, index, phrases, typeMs, deleteMs, holdMs, animate]);

  // Decorativo: o texto acessível real fica no <h1> (sr-only). aria-hidden evita
  // que o leitor de tela anuncie cada caractere digitado.
  if (!animate) {
    return <span className={className} aria-hidden="true">{phrases[0]}</span>;
  }

  return (
    <span className={className} aria-hidden="true">
      {shown}
      <span className="ml-0.5 inline-block h-[0.9em] w-[2px] -translate-y-[2px] animate-pulse bg-current align-middle" />
    </span>
  );
}
