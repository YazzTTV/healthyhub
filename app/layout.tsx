import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HealthyHub — Trouve le bon spot healthy autour de toi",
  description:
    "Selon ta localisation, tes objectifs et les restaurants les mieux notés. Découvre des spots healthy pour livraison, à emporter ou sur place — carte pensée comme un compagnon de découverte locale.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${inter.variable} ${inter.className}`}>
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
        <footer className="mx-auto mt-16 flex max-w-6xl flex-col gap-6 border-t border-ink/[0.06] px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Logo showWordmark />
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-soft">
              <Link href="/discover" className="hover:text-brand-dark">
                La carte
              </Link>
              <Link href="/about" className="hover:text-brand-dark">
                Méthodologie
              </Link>
              <Link href="/partners" className="hover:text-brand-dark">
                Pour les restos
              </Link>
              <a
                href="mailto:hello@healthyhub.fr"
                className="hover:text-brand-dark"
              >
                Contact
              </a>
            </nav>
          </div>
          <span className="text-sm text-ink-mute">
            © {new Date().getFullYear()} HealthyHub · Spots healthy autour de toi.
          </span>
        </footer>
      </body>
    </html>
  );
}
