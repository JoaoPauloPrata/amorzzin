export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-rose-100 bg-cream/60 py-10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="text-xl">💖</span>
          <span className="font-semibold text-ink">amorzzin</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink/60">
          <a href="#como-funciona" className="hover:text-ink">Como funciona</a>
          <a href="#planos"        className="hover:text-ink">Preços</a>
          <a href="#faq"           className="hover:text-ink">Perguntas</a>
          <a
            href="https://www.instagram.com/amorzzim/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink"
          >
            Instagram
          </a>
        </nav>

        <p className="text-xs text-ink/70">© {year} Amorzzin · Feito com 💖</p>
      </div>
    </footer>
  );
}
