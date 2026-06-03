import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { RecoverForm } from "@/components/recover/RecoverForm";

export const metadata: Metadata = {
  title: "Recuperar meu link — Amorzzin",
  description: "Reenvie o link da sua página Amorzzin para o e-mail usado na compra.",
};

export default function RecuperarPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[70svh] max-w-md flex-col justify-center px-6 py-16">
        <header className="mb-6 text-center">
          <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">
            Perdeu seu link?
          </h1>
          <p className="mt-2 text-ink/70">
            Reenviamos o link da sua página + QR Code para o e-mail usado na compra.
          </p>
        </header>

        <RecoverForm />
      </main>
    </>
  );
}
