import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
        404
      </p>
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-ink md:text-[40px]">
        Cette page n&apos;existe pas
      </h1>
      <p className="text-[15px] leading-relaxed text-ink-soft">
        L&apos;adresse a peut-être changé, ou le spot n&apos;est plus listé. Retourne
        sur l&apos;accueil ou ouvre la carte des restaurants.
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-full bg-white px-6 text-[14px] font-semibold text-ink ring-1 ring-ink/15 transition hover:bg-brand-light"
        >
          Accueil
        </Link>
        <Link
          href="/discover"
          className="inline-flex h-12 min-w-[200px] items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-white shadow-soft transition hover:bg-brand-dark"
        >
          La carte des spots
        </Link>
      </div>
    </div>
  );
}
