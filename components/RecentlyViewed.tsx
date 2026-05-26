"use client";

import TrackedRestaurantNavLink from "@/components/analytics/TrackedRestaurantNavLink";
import RestaurantImage from "@/components/RestaurantImage";
import { useEffect, useState } from "react";
import { recentlyViewedEntryToAnalytics } from "@/lib/analytics";
import { getRecentlyViewed, type ViewedEntry } from "@/lib/recently-viewed";

export default function RecentlyViewed() {
  const [list, setList] = useState<ViewedEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setList(getRecentlyViewed());
    setHydrated(true);
  }, []);

  if (!hydrated || list.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Tu as récemment vu
          </span>
          <h2 className="text-[20px] font-semibold tracking-tight text-ink">
            Reprends là où tu t&apos;étais arrêté.
          </h2>
        </div>
      </div>
      <div className="scrollbar-none flex gap-3 overflow-x-auto pb-2">
        {list.map((entry) => (
          <TrackedRestaurantNavLink
            key={entry.id}
            href={`/restaurants/${entry.id}`}
            restaurant={recentlyViewedEntryToAnalytics(entry)}
            placement="recently_viewed"
            className="group relative flex w-[220px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-white shadow-soft ring-1 ring-ink/[0.06] transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="relative aspect-[5/3] w-full overflow-hidden bg-brand-light">
              <RestaurantImage
                restaurant={{
                  id: entry.id,
                  name: entry.name,
                  slug: null,
                  image_url: entry.image_url,
                  image_status: entry.image_status,
                }}
                alt={entry.name}
                hideBadge
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-[13.5px] font-semibold tracking-tight text-ink">
                {entry.name}
              </p>
              <p className="truncate text-[11.5px] text-ink-mute">
                {[entry.category, entry.city].filter(Boolean).join(" · ")}
              </p>
            </div>
          </TrackedRestaurantNavLink>
        ))}
      </div>
    </section>
  );
}
