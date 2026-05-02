import Link from "next/link";
import type { RestaurantListItem } from "@/lib/types";
import { displayHealthyScore } from "@/lib/healthy-score";
import {
  getBestForLean,
  getBestForMuscle,
  getPickOfTheDay,
  getQuickPick,
  getReasonChips,
  getReasonSentence,
} from "@/lib/recommendations";
import { isVerified } from "@/lib/restaurant-credibility";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getRestaurantImage } from "@/lib/restaurant-images";

type Pick = {
  badge: string;
  badgeAccent: "brand" | "ink";
  restaurant: RestaurantListItem;
};

function buildPicks(restaurants: RestaurantListItem[]): Pick[] {
  const picks: Pick[] = [];
  const seen = new Set<string>();

  const today = getPickOfTheDay(restaurants);
  if (today) {
    picks.push({ badge: "Pick du jour", badgeAccent: "brand", restaurant: today });
    seen.add(today.id);
  }

  const lean = getBestForLean(restaurants);
  if (lean && !seen.has(lean.id)) {
    picks.push({ badge: "Best for Lean & Light", badgeAccent: "ink", restaurant: lean });
    seen.add(lean.id);
  }

  const quick = getQuickPick(restaurants);
  if (quick && !seen.has(quick.id)) {
    picks.push({ badge: "Lunch en moins de 15 min", badgeAccent: "ink", restaurant: quick });
    seen.add(quick.id);
  }

  // If we still need a 3rd, fall back to muscle pick
  if (picks.length < 3) {
    const muscle = getBestForMuscle(restaurants);
    if (muscle && !seen.has(muscle.id)) {
      picks.push({
        badge: "Best post-workout",
        badgeAccent: "ink",
        restaurant: muscle,
      });
    }
  }

  return picks;
}

export default function TopPicksStrip({
  restaurants,
}: {
  restaurants: RestaurantListItem[];
}) {
  const picks = buildPicks(restaurants);
  if (picks.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            Sélection HealthyHub
          </span>
          <h2 className="text-[28px] font-semibold leading-[1.1] tracking-tighter-display text-ink md:text-[34px]">
            On t&apos;aide à choisir.
          </h2>
        </div>
        <Link
          href="/discover"
          className="hidden h-10 items-center justify-center gap-1.5 rounded-full border border-ink/10 bg-white px-4 text-[12.5px] font-semibold text-ink-soft shadow-soft transition hover:border-brand/30 hover:text-brand-dark sm:inline-flex"
        >
          Toute la carte
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {picks.map((pick) => {
          const r = pick.restaurant;
          const reason = getReasonSentence(r);
          const chips = getReasonChips(r);
          return (
            <Link
              key={r.id}
              href={`/restaurants/${r.id}`}
              className="group relative flex flex-col overflow-hidden rounded-[28px] bg-white shadow-soft ring-1 ring-ink/[0.06] transition duration-250 ease-out-expo hover:-translate-y-0.5 hover:shadow-floating hover:ring-brand/30"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getRestaurantImage(r)}
                  alt={r.name}
                  className="h-full w-full object-cover transition duration-500 ease-out-expo group-hover:scale-[1.04]"
                />
                <span
                  className={`absolute left-3 top-3 inline-flex h-7 items-center rounded-full px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] shadow-soft ${
                    pick.badgeAccent === "brand"
                      ? "bg-brand text-white"
                      : "bg-white text-ink"
                  }`}
                >
                  {pick.badge}
                </span>
                {isVerified(r) ? (
                  <VerifiedBadge className="absolute right-3 top-3" />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                <div>
                  <h3 className="text-[18px] font-semibold tracking-tight text-ink">
                    {r.name}
                  </h3>
                  <p className="mt-0.5 text-[12.5px] text-ink-mute">
                    {[r.category, r.city].filter(Boolean).join(" · ")}
                  </p>
                </div>

                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  {reason}
                </p>

                {chips.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map((c) => (
                      <span
                        key={c}
                        className="rounded-full border border-brand/20 bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand-deep"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-deep">
                    ● {displayHealthyScore(r).toFixed(1)} healthy
                  </span>
                  <span className="text-[12.5px] font-semibold text-brand-dark group-hover:text-brand">
                    Voir →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
