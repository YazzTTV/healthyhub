"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
          <Link
            key={entry.id}
            href={`/restaurants/${entry.id}`}
            className="group relative flex w-[220px] shrink-0 flex-col overflow-hidden rounded-[20px] bg-white shadow-soft ring-1 ring-ink/[0.06] transition hover:-translate-y-0.5 hover:shadow-elevated"
          >
            <div className="relative aspect-[5/3] w-full overflow-hidden bg-brand-light">
              {entry.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.image_url}
                  alt={entry.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl">
                  🥗
                </div>
              )}
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-[13.5px] font-semibold tracking-tight text-ink">
                {entry.name}
              </p>
              <p className="truncate text-[11.5px] text-ink-mute">
                {[entry.category, entry.city].filter(Boolean).join(" · ")}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
