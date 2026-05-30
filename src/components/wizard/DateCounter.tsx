"use client";

import { useEffect, useState } from "react";

type Props = { startDate?: string; className?: string };

function diff(start: Date, now: Date) {
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  let minutes = now.getMinutes() - start.getMinutes();
  let seconds = now.getSeconds() - start.getSeconds();

  if (seconds < 0) { seconds += 60; minutes -= 1; }
  if (minutes < 0) { minutes += 60; hours -= 1; }
  if (hours < 0)   { hours += 24;   days -= 1;   }
  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months -= 1;
  }
  if (months < 0) { months += 12; years -= 1; }

  return { years, months, days, hours, minutes, seconds };
}

export function DateCounter({ startDate, className }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!startDate || !now) {
    return (
      <div className={className}>
        <p className="text-[10px] uppercase tracking-widest opacity-70">Juntos há</p>
        <p className="font-mono text-lg font-semibold opacity-60">— anos — meses</p>
      </div>
    );
  }

  const start = new Date(startDate);
  if (Number.isNaN(start.getTime()) || start > now) {
    return (
      <div className={className}>
        <p className="text-[10px] uppercase tracking-widest opacity-70">Juntos há</p>
        <p className="font-mono text-lg font-semibold opacity-60">data inválida</p>
      </div>
    );
  }

  const d = diff(start, now);

  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-widest opacity-70">Juntos há</p>
      <p className="font-mono text-lg font-semibold">
        {d.years > 0 && <>{d.years}a </>}
        {d.months}m {d.days}d
      </p>
      <p className="font-mono text-[10px] opacity-70">
        {String(d.hours).padStart(2,"0")}:{String(d.minutes).padStart(2,"0")}:{String(d.seconds).padStart(2,"0")}
      </p>
    </div>
  );
}
