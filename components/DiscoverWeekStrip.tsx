"use client";

import Link from "next/link";
import type { WeekSpotlight } from "@/lib/discover-recommendations";

export default function DiscoverWeekStrip({
  items,
}: {
  items: WeekSpotlight[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white/95 px-3 py-2.5 shadow-soft ring-1 ring-ink/[0.06] backdrop-blur-sm supports-[backdrop-filter]:bg-white/88 sm:px-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-deep/85">
        Cette semaine sur HealthyHub
      </p>
      <ul className="mt-2 space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex gap-2 border-b border-ink/[0.04] pb-2 last:border-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-ink/90">{it.headline}</p>
              <Link
                href={`/restaurants/${it.restaurantId}`}
                className="mt-0.5 block truncate text-[12.5px] font-medium text-brand-dark underline-offset-2 hover:underline"
              >
                {it.title}
              </Link>
              <p className="mt-0.5 text-[10px] leading-snug text-ink/55">{it.subtitle}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[9.5px] leading-snug text-ink/45">
        Sélection mise à jour régulièrement — pas de classement minute par minute.
      </p>
    </div>
  );
}
