"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { loadDiscoverRestaurantsPage } from "@/app/discover/actions";
import type { RestaurantListItem } from "@/lib/types";

type Props = {
  currentPage: number;
  hasMore: boolean;
  /** Filtres actifs → pagination client uniquement. */
  filtersActive: boolean;
  onClientLoadMore: () => void;
  onServerAppend: (restaurants: RestaurantListItem[], nextPage: number) => void;
  className?: string;
};

export default function LoadMore({
  currentPage,
  hasMore,
  filtersActive,
  onClientLoadMore,
  onServerAppend,
  className = "",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!hasMore) return null;

  const handleClick = () => {
    setError(null);
    const nextPage = currentPage + 1;

    if (filtersActive) {
      onClientLoadMore();
      return;
    }

    startTransition(async () => {
      const result = await loadDiscoverRestaurantsPage(nextPage);
      if (result.error) {
        setError("Impossible de charger la suite.");
        return;
      }
      onServerAppend(result.restaurants, nextPage);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(nextPage));
      router.push(`/discover?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className={`flex flex-col items-center gap-2 py-3 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-brand px-6 text-[13px] font-semibold text-white shadow-soft transition hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Chargement…" : "Voir plus"}
      </button>
      {error ? (
        <p className="text-center text-[12px] text-amber-800">{error}</p>
      ) : null}
    </div>
  );
}
