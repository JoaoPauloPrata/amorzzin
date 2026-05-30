import Link from "next/link";

export default function PublicPageNotFound() {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-gradient-to-b from-rose-500 via-rose-400 to-lilac-500 px-6 text-center text-white">
      <span className="text-6xl">💔</span>
      <h1 className="mt-6 font-display text-3xl font-bold drop-shadow">
        Página não encontrada
      </h1>
      <p className="mt-3 max-w-sm text-white/85">
        Esta página não existe, ainda não foi publicada ou já expirou.
        Confira o link recebido por e-mail.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-white/20 px-6 py-3 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/30"
      >
        Criar minha página 💛
      </Link>
    </main>
  );
}
