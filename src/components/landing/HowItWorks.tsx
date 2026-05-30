const STEPS = [
  {
    icon: "✍️",
    title: "Personalize",
    body: "Escreva a mensagem, escolha as fotos, a música e o estilo da página.",
  },
  {
    icon: "💳",
    title: "Pague em segundos",
    body: "Pix instantâneo ou cartão de crédito. Sem assinatura, sem renovação.",
  },
  {
    icon: "📩",
    title: "Receba link + QR Code",
    body: "Tudo chega no seu e-mail assim que o pagamento for confirmado.",
  },
  {
    icon: "💖",
    title: "Surpreenda",
    body: "Manda no WhatsApp, mostra com o QR no presente, e pronto.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-lilac-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-lilac-700 backdrop-blur">
            🪄 Como funciona?
          </span>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
            Sua página pronta em <span className="gradient-text">4 passos</span>
          </h2>
          <p className="mt-4 text-lg text-ink/70 text-balance">
            Sem login. Sem complicação. Você escreve, paga e compartilha.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="group relative rounded-2xl border border-rose-100 bg-white/70 p-6 backdrop-blur transition-transform hover:-translate-y-1 hover:shadow-soft"
            >
              <span className="absolute right-4 top-4 font-mono text-xs font-bold text-rose-300">
                0{i + 1}
              </span>
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-rose-100 to-lilac-100 text-2xl">
                {step.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
