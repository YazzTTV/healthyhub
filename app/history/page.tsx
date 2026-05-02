"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUserHistory } from "@/lib/user-data";

type HistoryItem = {
  id: string;
  restaurant_id: string;
  action: string;
  created_at: string;
};

const actionLabel: Record<string, string> = {
  viewed_restaurant: "Fiche restaurant consultée",
  clicked_order_ubereats: "Clic commande Uber Eats",
  clicked_order_deliveroo: "Clic commande Deliveroo",
  clicked_marker: "Marker carte cliqué",
  clicked_card: "Carte restaurant cliquée",
};

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
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
      const history = (await getUserHistory(currentUser.id)) as HistoryItem[];
      if (!mounted) return;
      setItems(history);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatted = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        dateLabel: new Date(item.created_at).toLocaleString("fr-FR"),
      })),
    [items]
  );

  if (loading) {
    return (
      <section className="space-y-8 py-2">
        <div className="h-8 w-56 animate-pulse rounded-full bg-white/80 ring-1 ring-ink/[0.06]" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[72px] animate-pulse rounded-2xl bg-white ring-1 ring-ink/[0.06]"
            />
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
            Activité
          </span>
          <h1 className="text-[34px] font-semibold leading-[1.08] tracking-tighter-display text-ink md:text-[40px]">
            Mon <span className="text-brand-dark">historique</span>
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            Connecte-toi pour retrouver tes explorations sur la carte.
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
          Activité
        </span>
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-tighter-display text-ink md:text-[40px]">
          Mon <span className="text-brand-dark">historique</span>
        </h1>
        <p className="max-w-xl text-[15px] text-ink-soft">
          {formatted.length === 0
            ? "Tes visites de fiches et ta navigation sur la carte apparaîtront ici."
            : "Ce que tu as exploré récemment sur la carte."}
        </p>
      </header>

      {formatted.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-ink/15 bg-white/60 px-8 py-14 text-center shadow-soft ring-1 ring-ink/[0.04]">
          <p className="text-[15px] text-ink-mute">Ton historique est vide pour le moment.</p>
          <Link
            href="/discover"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark hover:shadow-elevated active:translate-y-px"
          >
            Voir la carte des spots
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {formatted.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl bg-white px-5 py-4 shadow-soft ring-1 ring-ink/[0.06] transition hover:ring-brand/20"
            >
              <p className="text-[14.5px] font-semibold tracking-tight text-ink">
                {actionLabel[item.action] ?? item.action}
              </p>
              <p className="mt-1 text-[12px] text-ink-mute">{item.dateLabel}</p>
              <Link
                href={`/restaurants/${item.restaurant_id}`}
                className="mt-2 inline-flex text-[13px] font-semibold text-brand transition hover:text-brand-dark"
              >
                Voir le lieu →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
