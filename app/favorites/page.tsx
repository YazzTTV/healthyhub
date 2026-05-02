"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getFavoriteRestaurants } from "@/lib/user-data";
import type { RestaurantListItem } from "@/lib/types";
import RestaurantImage from "@/components/RestaurantImage";

export default function FavoritesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<RestaurantListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(currentUser ?? null);
      if (!currentUser) {
        setLoading(false);
        return;
      }
      const restaurants = await getFavoriteRestaurants(currentUser.id);
      if (!mounted) return;
      setItems(restaurants);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="space-y-8 py-2">
        <div className="h-8 w-48 animate-pulse rounded-full bg-white/80 ring-1 ring-ink/[0.06]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse overflow-hidden rounded-[28px] bg-white ring-1 ring-ink/[0.06]"
            >
              <div className="aspect-[4/3] bg-brand-light/60" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-3/4 rounded-full bg-ink/[0.06]" />
                <div className="h-3 w-1/2 rounded-full bg-ink/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="mx-auto max-w-lg space-y-6 py-4 md:py-8">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            Favoris
          </span>
          <h1 className="text-[34px] font-semibold leading-[1.08] tracking-tighter-display text-ink md:text-[40px]">
            Mes coups de <span className="text-brand-dark">cœur</span>
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Connecte-toi pour sauvegarder tes spots préférés sur la carte.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark hover:shadow-elevated active:translate-y-px"
        >
          Se connecter
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-8 py-2 md:py-4">
      <header className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
          Favoris
        </span>
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-tighter-display text-ink md:text-[40px]">
          Mes coups de <span className="text-brand-dark">cœur</span>
        </h1>
        <p className="max-w-xl text-[15px] text-ink-soft">
          {items.length === 0
            ? "Ajoute des spots depuis la carte ou une fiche lieu."
            : `${items.length} spot${items.length > 1 ? "s" : ""} enregistré${items.length > 1 ? "s" : ""}.`}
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-ink/15 bg-white/60 px-8 py-14 text-center shadow-soft ring-1 ring-ink/[0.04]">
          <p className="text-[15px] text-ink-mute">
            Tu n&apos;as pas encore enregistré de spots.
          </p>
          <Link
            href="/discover"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark hover:shadow-elevated active:translate-y-px"
          >
            Voir la carte des spots
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.id}`}
              className="group flex flex-col overflow-hidden rounded-[28px] bg-white shadow-soft ring-1 ring-ink/[0.06] transition duration-250 ease-out-expo hover:-translate-y-0.5 hover:shadow-floating hover:ring-brand/30"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-brand-light">
                <RestaurantImage
                  restaurant={restaurant}
                  alt={restaurant.name}
                  className="h-full w-full object-cover transition duration-500 ease-out-expo group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-5">
                <h2 className="text-[17px] font-semibold tracking-tight text-ink">
                  {restaurant.name}
                </h2>
                <p className="text-[13px] text-ink-mute">
                  {[restaurant.category, restaurant.city].filter(Boolean).join(" · ")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
