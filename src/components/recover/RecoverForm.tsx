"use client";

import { useState } from "react";
import { recoverPage } from "@/app/recuperar/actions";

export function RecoverForm() {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await recoverPage(email);
    setLoading(false);
    if (!res.ok) { setError(res.error); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white/80 p-6 text-center shadow-soft">
        <span className="text-4xl">📬</span>
        <h2 className="mt-3 font-display text-xl font-bold text-ink">Pronto!</h2>
        <p className="mt-2 text-sm text-ink/70">
          Se existir uma página ativa para <strong>{email}</strong>, reenviamos o link e o QR
          Code para esse e-mail. Confere a caixa de entrada (e o spam) em alguns minutos.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-rose-100 bg-white/80 p-6 shadow-soft">
      <label htmlFor="recover-email" className="text-sm font-medium text-ink/80">
        E-mail usado na compra
      </label>
      <input
        id="recover-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="voce@email.com"
        className="mt-1 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-ink shadow-sm outline-none transition-colors focus:border-rose-400"
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-lilac-500 px-6 py-3 text-sm font-semibold text-white shadow-soft transition-transform disabled:opacity-70 enabled:hover:scale-[1.02]"
      >
        {loading ? "Enviando…" : "Reenviar meu link"}
      </button>

      <p className="mt-3 text-center text-xs text-ink/50">
        Por segurança, não informamos se o e-mail existe. Se houver página ativa, o link chega
        por e-mail.
      </p>
    </form>
  );
}
