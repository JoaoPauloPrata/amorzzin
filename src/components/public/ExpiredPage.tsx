import Link from "next/link";

export function ExpiredPage({ recipient }: { recipient: string | null }) {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-gradient-to-b from-rose-500 via-rose-400 to-lilac-500 px-6 text-center text-white">
      <span className="text-6xl">⏳</span>
      <h1 className="mt-6 font-display text-3xl font-bold drop-shadow md:text-4xl">
        Esta página expirou
      </h1>
      <p className="mt-3 max-w-sm text-white/85">
        {recipient ? `A página para ${recipient} ` : "A página "}
        chegou ao fim do plano e não está mais disponível. Que tal criar uma nova,
        para sempre? 💛
      </p>
      <Link
        href="/criar"
        className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-semibold text-rose-600 shadow-soft transition-transform hover:scale-[1.03]"
      >
        Criar uma nova página
      </Link>
      <Link href="/" className="mt-4 text-sm text-white/70 underline underline-offset-2 hover:text-white">
        Voltar ao início
      </Link>
    </main>
  );
}
