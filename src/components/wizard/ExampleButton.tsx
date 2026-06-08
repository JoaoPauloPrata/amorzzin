"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

// Botão "Usar exemplo": cada clique aplica o próximo item da lista (cicla).
// Mantém o índice internamente — clicar de novo troca pelo exemplo seguinte.
export function ExampleButton<T>({
  items,
  onPick,
  label = "Usar exemplo",
  className,
}: {
  items: T[];
  onPick: (value: T) => void;
  label?: string;
  className?: string;
}) {
  const [i, setI] = useState(0);

  if (items.length === 0) return null;

  return (
    <button
      type="button"
      onClick={() => {
        onPick(items[i % items.length]);
        setI((n) => n + 1);
      }}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-rose-200 bg-rose-50/70 px-3 py-1 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-100",
        className,
      )}
    >
      <span aria-hidden>↻</span> {label}
    </button>
  );
}
