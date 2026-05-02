"use client";

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import RestaurantImage from "@/components/RestaurantImage";
import MacrosTeaser from "@/components/MacrosTeaser";
import { displayHealthyScore } from "@/lib/healthy-score";
import { getPrimaryActionUrl } from "@/lib/discover-recommendations";
import {
  getIntentReason,
  getRecommendedDishForIntent,
  type IntentMode,
} from "@/lib/intent";
import type { RestaurantListItem } from "@/lib/types";
import RestaurantNavigateCTA from "@/components/RestaurantNavigateCTA";

type Props = {
  restaurant: RestaurantListItem;
  intentMode: IntentMode;
  intentLabel: string;
  distanceKm: number | null;
  detailHref: string;
};

export default function DiscoverBestChoiceCard({
  restaurant,
  intentMode,
  intentLabel,
  distanceKm,
  detailHref,
}: Props) {
  const dish = getRecommendedDishForIntent(restaurant, intentMode);
  const why = getIntentReason(restaurant, intentMode);
  const orderUrl = getPrimaryActionUrl(restaurant);

  useEffect(() => {
    void trackEvent({
      event_name: "best_choice_viewed",
      restaurant_id: restaurant.id,
      metadata: {
        intent: intentMode,
        has_location: distanceKm != null,
      },
    });
  }, [restaurant.id, intentMode, distanceKm]);

  const fireChoice = (cta: string) => {
    void trackEvent({
      event_name: "best_choice_clicked",
      restaurant_id: restaurant.id,
      metadata: { intent: intentMode, cta },
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-ink/[0.06]">
      <div className="flex gap-3 p-3 sm:gap-3.5 sm:p-3.5">
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl bg-brand-light sm:h-[80px] sm:w-[80px]">
          <RestaurantImage
            restaurant={restaurant}
            alt=""
            className="h-full w-full object-cover"
          />
          <span className="absolute left-1 top-1 rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-deep shadow-soft">
            Top
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[13px] font-semibold leading-tight tracking-tight text-ink sm:text-[14px]">
            Notre meilleur choix autour de toi
          </h2>
          <p className="mt-1 text-[10px] leading-snug text-ink/55">
            Recommandation basée sur ton objectif, la proximité et le score
            HealthyHub.
          </p>
          <p className="mt-1.5 truncate text-[14px] font-semibold tracking-tight text-ink">
            {restaurant.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand-deep ring-1 ring-brand/20">
              {intentLabel}
            </span>
            {distanceKm != null ? (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-ink/70">
                {distanceKm.toFixed(1)} km
              </span>
            ) : (
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/55">
                Distance locale après géoloc
              </span>
            )}
            <span className="rounded-full bg-brand-light/90 px-2 py-0.5 text-[10px] font-semibold text-brand-deep">
              {displayHealthyScore(restaurant).toFixed(1)} healthy
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-ink/[0.05] px-3 pb-3 pt-2 sm:px-3.5">
        <Link
          href={detailHref}
          className="group block w-full text-left"
          onClick={() => {
            void trackEvent({
              event_name: "recommended_dish_clicked",
              restaurant_id: restaurant.id,
              metadata: { source: "best_choice", intent: intentMode },
            });
            fireChoice("dish");
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-deep/90">
            Plat conseillé
          </p>
          <p className="mt-0.5 text-[13px] font-medium leading-snug text-ink group-hover:text-brand-dark">
            {dish}
          </p>
        </Link>
        <p className="mt-1.5 text-[11.5px] leading-snug text-ink/65">{why}</p>
        <div className="mt-2">
          <MacrosTeaser
            restaurant={restaurant}
            dishName={dish}
            variant="compact"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-ink/[0.05] px-3 py-2.5 sm:px-3.5">
        <RestaurantNavigateCTA
          restaurant={restaurant}
          source="best_choice"
          hasOrderLinks={Boolean(orderUrl)}
          size="sm"
          distanceKm={distanceKm}
          showDistance={false}
          className="min-w-[100px] flex-1 flex-col"
          buttonClassName="w-full"
          onNavigatePress={() => fireChoice("navigate")}
        />
        {orderUrl ? (
          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              fireChoice("order");
              void trackEvent({
                event_name: "order_clicked",
                restaurant_id: restaurant.id,
                metadata: { source: "best_choice" },
              });
            }}
            className="inline-flex h-8 min-h-[40px] flex-1 items-center justify-center rounded-full bg-brand px-3 text-[12px] font-semibold text-white shadow-soft transition hover:bg-brand-dark sm:min-h-[36px]"
          >
            Commander
          </a>
        ) : null}
        <Link
          href={detailHref}
          onClick={() => fireChoice("view")}
          className="inline-flex h-8 min-h-[40px] min-w-[72px] items-center justify-center rounded-full bg-white px-3 text-[12px] font-semibold text-ink ring-1 ring-ink/12 transition hover:ring-brand/35 sm:min-h-[36px]"
        >
          Voir
        </Link>
      </div>
    </div>
  );
}
