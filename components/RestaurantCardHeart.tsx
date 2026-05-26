"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LOCAL_FAVORITES_CHANGED_EVENT,
  readFavoriteIdsFromStorage,
  writeFavoriteIdsToStorage,
  notifyLocalFavoritesChanged,
} from "@/lib/local-favorites";

export default function RestaurantCardHeart({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const [active, setActive] = useState(false);

  const sync = useCallback(() => {
    setActive(readFavoriteIdsFromStorage().includes(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    sync();
    window.addEventListener(LOCAL_FAVORITES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(LOCAL_FAVORITES_CHANGED_EVENT, sync);
  }, [sync]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = readFavoriteIdsFromStorage();
    const next = cur.includes(restaurantId)
      ? cur.filter((id) => id !== restaurantId)
      : [...cur, restaurantId];
    writeFavoriteIdsToStorage(next);
    setActive(next.includes(restaurantId));
    notifyLocalFavoritesChanged();
  };

  return (
    <button
      type="button"
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-pressed={active}
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-lg shadow-soft ring-1 ring-ink/[0.08] backdrop-blur transition hover:ring-brand/35"
    >
      <span className={active ? "text-red-500" : "text-ink/35"} aria-hidden>
        {active ? "♥" : "♡"}
      </span>
    </button>
  );
}
