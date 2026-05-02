"use client";

import Link from "next/link";

export default function RestaurantRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-800">
        Erreur de chargement
      </p>
      <h1 className="text-[26px] font-semibold leading-tight text-ink md:text-[32px]">
        Impossible d&apos;afficher ce restaurant
      </h1>
      <p className="text-[15px] leading-relaxed text-ink-soft">
        {error.message ||
          "Un problème temporaire empêche de charger les données. Vérifie ta connexion ou réessaie."}
      </p>
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-white shadow-soft transition hover:bg-brand-dark"
        >
          Réessayer
        </button>
        <Link
          href="/discover"
          className="inline-flex h-12 min-w-[160px] items-center justify-center rounded-full bg-white px-6 text-[14px] font-semibold text-ink ring-1 ring-ink/15 transition hover:bg-brand-light"
        >
          Retour à la carte
        </Link>
      </div>
    </div>
  );
}
