export function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-rose-200/60 via-lilac-200/60 to-transparent blur-2xl" />
      <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-3 shadow-soft backdrop-blur">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2rem] bg-gradient-to-b from-rose-500 via-rose-400 to-lilac-500">
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black/70" />

          <div className="flex h-full flex-col p-5 pt-10 text-white">
            <span className="self-start rounded-full bg-white/20 px-3 py-1 text-[10px] font-medium backdrop-blur">
              💜 Design personalizado
            </span>

            <div className="mt-4 text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/70">Para Joana</p>
              <h3 className="mt-1 font-serif text-2xl leading-tight">
                Eu te amo, hoje e sempre.
              </h3>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {[0,1,2,3,4,5].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-md bg-white/20 ring-1 ring-white/20"
                />
              ))}
            </div>

            <div className="mt-auto rounded-xl bg-white/15 p-3 text-center backdrop-blur">
              <p className="text-[10px] text-white/70">Juntos há</p>
              <p className="font-mono text-lg font-semibold">2 anos 4 meses</p>
              <p className="text-[10px] text-white/70">e 12 dias</p>
            </div>

            <div className="mt-3 flex items-center justify-center gap-3 text-xl">
              <span>‹</span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-rose-500 shadow">💖</span>
              <span>›</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 text-center text-xs font-medium text-ink/60">
        › Pré-visualização real do que você cria
      </div>
    </div>
  );
}
