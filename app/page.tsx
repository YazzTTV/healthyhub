import DiscoverCTA from "@/components/DiscoverCTA";
import Link from "next/link";

export default function LandingPage() {
  return (
    <section className="grid items-center gap-12 py-8 md:grid-cols-2 md:py-16">
      <div className="space-y-7">
        <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          Manger sain, sans compromis
        </span>

        <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-ink md:text-6xl">
          Uber Eats, sans junk food.
        </h1>

        <p className="max-w-md text-lg text-ink/70">
          Découvre uniquement des restaurants healthy autour de toi. Zéro
          tentation, décision rapide, commande en quelques clics.
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <DiscoverCTA />
          <Link
            href="/partners"
            className="inline-flex items-center rounded-full border border-ink/15 bg-white px-6 py-3.5 text-sm font-semibold text-ink transition hover:border-brand/30 hover:text-brand"
          >
            Référencer mon restaurant
          </Link>
        </div>
      </div>

      <div className="relative aspect-[4/5] overflow-hidden rounded-4xl bg-brand-light md:aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1400&auto=format&fit=crop"
          alt="Bol healthy aux légumes frais"
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  );
}
