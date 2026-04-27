import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Logo from "@/components/Logo";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HealthyHub — Manger sain, livré chez vous",
  description:
    "Les meilleurs restaurants healthy de Paris, livrés en un clic via Uber Eats ou Deliveroo.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
        <footer className="mx-auto flex max-w-6xl items-center justify-between px-5 py-10 text-sm text-ink/60">
          <Logo showWordmark />
          <span>© {new Date().getFullYear()} · Manger sain, livré.</span>
        </footer>
      </body>
    </html>
  );
}
