import Link from "next/link";
import Logo from "@/components/Logo";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-ink/5 bg-cream/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="Retour à l'accueil HealthyHub">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/partners"
            className="rounded-full px-4 py-2 text-sm font-medium text-ink/70 hover:text-brand"
          >
            Restaurants partenaires
          </Link>
          <Link
            href="/discover"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
          >
            Découvrir
          </Link>
        </div>
      </nav>
    </header>
  );
}
