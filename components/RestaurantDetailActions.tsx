"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  addFavorite,
  getUserFavorites,
  removeFavorite,
  trackUserHistory,
} from "@/lib/user-data";

export default function RestaurantDetailActions({
  restaurantId,
}: {
  restaurantId: string;
}) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUserId(user?.id ?? null);
      if (!user) return;
      const rows = await getUserFavorites(user.id);
      if (!mounted) return;
      setIsFavorite(rows.some((row) => row.restaurant_id === restaurantId));
      await trackUserHistory("viewed_restaurant", restaurantId, { source: "detail_page" });
    })();
    return () => {
      mounted = false;
    };
  }, [restaurantId]);

  const toggle = async () => {
    if (!userId) {
      setPrompt(true);
      return;
    }
    if (isFavorite) {
      await removeFavorite(userId, restaurantId);
      setIsFavorite(false);
      return;
    }
    await addFavorite(userId, restaurantId);
    setIsFavorite(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void toggle()}
        className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
          isFavorite
            ? "bg-rose-100 text-rose-700"
            : "bg-white text-ink ring-1 ring-ink/15 hover:bg-brand-light"
        }`}
      >
        {isFavorite ? "Retirer des coups de cœur" : "Ajouter aux coups de cœur"}
      </button>
      {prompt ? (
        <div className="fixed inset-0 z-[1400] flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <p className="text-base font-semibold text-ink">
              Connecte-toi pour garder ce spot en favori.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white"
              >
                Se connecter
              </Link>
              <button
                type="button"
                onClick={() => setPrompt(false)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-ink/15"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
