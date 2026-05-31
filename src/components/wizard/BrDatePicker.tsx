"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ── helpers de data (date-only, sem timezone) ──────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function isoToBr(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function partsToIso(y: number, mo: number, d: number): string {
  return `${y}-${pad(mo)}-${pad(d)}`;
}

// Valida dd/mm/aaaa completo e que seja data real. Retorna ISO ou null.
function brToIso(br: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return null;
  const d = +m[1], mo = +m[2], y = +m[3];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900) return null;
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return partsToIso(y, mo, d);
}

function maskBr(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  let out = d.slice(0, 2);
  if (d.length > 2) out += "/" + d.slice(2, 4);
  if (d.length > 4) out += "/" + d.slice(4, 8);
  return out;
}

type Props = {
  value: string;                 // ISO yyyy-mm-dd ou ""
  onChange: (iso: string) => void;
  max?: string;                  // ISO máximo permitido (default: hoje)
  id?: string;
};

export function BrDatePicker({ value, onChange, max, id }: Props) {
  const [text, setText]   = useState(() => isoToBr(value));
  const [open, setOpen]   = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // hoje (local, date-only)
  const today = useMemo(() => {
    const n = new Date();
    return partsToIso(n.getFullYear(), n.getMonth() + 1, n.getDate());
  }, []);
  const maxIso = max ?? today;

  // mês/ano em exibição no calendário
  const initial = value || maxIso;
  const [view, setView] = useState(() => {
    const [y, m] = initial.split("-").map(Number);
    return { y, m: m - 1 }; // m 0-based
  });

  // sincroniza texto quando value muda de fora
  useEffect(() => { setText(isoToBr(value)); }, [value]);

  // fecha ao clicar fora
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function commitText(t: string) {
    const iso = brToIso(t);
    if (iso) {
      // respeita o máximo
      if (iso > maxIso) { onChange(maxIso); setText(isoToBr(maxIso)); return; }
      onChange(iso);
      const [y, m] = iso.split("-").map(Number);
      setView({ y, m: m - 1 });
    } else if (t === "") {
      onChange("");
    }
  }

  // grade do calendário
  const grid = useMemo(() => {
    const first = new Date(view.y, view.m, 1);
    const offset = first.getDay();                       // 0=Dom
    const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [view]);

  function selectDay(d: number) {
    const iso = partsToIso(view.y, view.m + 1, d);
    if (iso > maxIso) return;
    onChange(iso);
    setText(isoToBr(iso));
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const nm = v.m + delta;
      const y = v.y + Math.floor(nm / 12);
      const m = ((nm % 12) + 12) % 12;
      return { y, m };
    });
  }

  const selISO = value;

  return (
    <div ref={boxRef} className="relative">
      <div className="relative mt-1">
        <input
          id={id}
          value={text}
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          onChange={(e) => {
            const masked = maskBr(e.target.value);
            setText(masked);
            if (masked.length === 10) commitText(masked);
            else if (masked === "") onChange("");
          }}
          onBlur={() => commitText(text)}
          onFocus={() => setOpen(true)}
          className="w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 pr-11 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
        />
        <button
          type="button"
          aria-label="Abrir calendário"
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-rose-50 hover:text-rose-600"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="absolute z-30 mt-2 w-[19rem] rounded-2xl border border-ink/10 bg-white p-3 shadow-xl">
          {/* header */}
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => shiftMonth(-1)} aria-label="Mês anterior"
              className="rounded-lg p-1.5 text-ink/60 transition-colors hover:bg-rose-50 hover:text-rose-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="text-sm font-semibold text-ink">{MESES[view.m]} {view.y}</span>
            <button type="button" onClick={() => shiftMonth(1)} aria-label="Próximo mês"
              className="rounded-lg p-1.5 text-ink/60 transition-colors hover:bg-rose-50 hover:text-rose-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>

          {/* dias da semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink/40">
            {SEMANA.map((s) => <div key={s} className="py-1">{s}</div>)}
          </div>

          {/* grade */}
          <div className="grid grid-cols-7 gap-1">
            {grid.map((d, i) => {
              if (d === null) return <div key={i} />;
              const iso = partsToIso(view.y, view.m + 1, d);
              const disabled = iso > maxIso;
              const selected = iso === selISO;
              const isToday = iso === today;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(d)}
                  className={cn(
                    "h-9 rounded-lg text-sm transition-colors",
                    disabled && "cursor-not-allowed text-ink/20",
                    !disabled && !selected && "text-ink hover:bg-rose-50",
                    selected && "bg-gradient-to-r from-rose-500 to-lilac-500 font-semibold text-white",
                    !selected && isToday && "ring-1 ring-rose-300",
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {/* ações */}
          <div className="mt-2 flex items-center justify-between border-t border-ink/5 pt-2 text-xs font-semibold">
            <button type="button" onClick={() => { onChange(""); setText(""); }}
              className="rounded-lg px-2 py-1 text-ink/50 transition-colors hover:text-rose-600">
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                const [y, m] = today.split("-").map(Number);
                setView({ y, m: m - 1 });
                onChange(today);
                setText(isoToBr(today));
                setOpen(false);
              }}
              className="rounded-lg px-2 py-1 text-rose-600 transition-colors hover:text-rose-700"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
