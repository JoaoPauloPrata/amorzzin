import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces, Caveat } from "next/font/google";
import "./globals.css";

import { MetaPixel } from "@/components/MetaPixel";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Serif editorial (com itálico) — usada no estilo "Revista".
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  axes: ["SOFT", "opsz"],
});
// Manuscrita — acentos no estilo "Polaroid".
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Amorzzin — Páginas personalizadas com amor",
  description:
    "Crie uma página personalizada com fotos, contador de tempo e mensagem para presentear quem você ama.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${caveat.variable} antialiased`}
      >
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
