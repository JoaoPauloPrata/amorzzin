"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos",        label: "Planos" },
  { href: "#faq",           label: "Perguntas" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all",
        scrolled
          ? "bg-cream/85 backdrop-blur border-b border-rose-100 shadow-soft"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">💖</span>
          <span className="text-xl font-semibold tracking-tight text-ink">amorzin</span>
        </Link>

        <nav className="hidden gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-ink/80 transition-colors hover:text-rose-600"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <Link
            href="/criar"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-cream transition-transform hover:scale-[1.03]"
          >
            Criar minha página
          </Link>
        </div>

        <button
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="rounded-full border border-rose-200 bg-cream/80 p-2 md:hidden"
        >
          <span className="block h-0.5 w-5 bg-ink" />
          <span className="mt-1 block h-0.5 w-5 bg-ink" />
          <span className="mt-1 block h-0.5 w-5 bg-ink" />
        </button>
      </div>

      {open && (
        <div className="border-t border-rose-100 bg-cream/95 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink/80"
              >
                {l.label}
              </a>
            ))}
            <Link
              href="/criar"
              className="mt-2 rounded-full bg-ink px-5 py-2.5 text-center text-sm font-semibold text-cream"
            >
              Criar minha página
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
