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

  useEffect(() => {
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
  }, [shown, deleting, index, phrases, typeMs, deleteMs, holdMs]);

  return (
    <span className={className} aria-live="polite">
      {shown}
      <span className="ml-0.5 inline-block h-[0.9em] w-[2px] -translate-y-[2px] animate-pulse bg-current align-middle" />
    </span>
  );
}
