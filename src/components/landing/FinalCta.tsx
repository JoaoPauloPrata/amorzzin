import Link from "next/link";

export function FinalCta() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-rose-400 to-lilac-500 p-10 text-center text-white shadow-soft md:p-16">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

        <h2 className="font-display text-4xl font-bold leading-tight text-balance md:text-5xl">
          Hoje é um bom dia pra fazer ela sorrir.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/90 text-balance">
          Cinco minutos pra criar. Uma vida inteira pra lembrar.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/criar"
            className="rounded-full bg-white px-7 py-3.5 text-base font-semibold text-rose-600 shadow-soft transition-transform hover:scale-[1.03]"
          >
            💖 Criar minha página
          </Link>
          <a
            href="#planos"
            className="text-sm font-medium text-white/90 underline-offset-4 hover:underline"
          >
            Ver planos
          </a>
        </div>
      </div>
    </section>
  );
}
