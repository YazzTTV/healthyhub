"use client";

import Link from "next/link";
import { useState } from "react";
import CommanderLink from "@/components/CommanderLink";
import RestaurantImage from "@/components/RestaurantImage";
import { displayHealthyScore } from "@/lib/healthy-score";
import { canShowCommanderForRestaurant } from "@/lib/order-delivery-status";
import NutritionChipsRow from "@/components/NutritionChipsRow";
import {
  getExactMacroLine,
  getScoreGlobalDisplay,
} from "@/lib/restaurant-card-display";
import { getNutritionOrientationChips } from "@/lib/restaurant-credibility";
import { getDisplayRating, getDisplayReviewCount } from "@/lib/restaurant-helpers";
import { getSignatureDishName } from "@/lib/signature-dish";
import type { RestaurantListItem } from "@/lib/types";

type Props = {
  restaurant: RestaurantListItem;
  isFavorite: boolean;
  isActive: boolean;
  distanceLabel: string | null;
  whyLine: string | null;
  dishLine: string | null;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onCardClick: () => void;
  layout?: "desktop" | "mobile";
};

export default function DiscoverPanelCard({
  restaurant,
  isFavorite,
  isActive,
  distanceLabel,
  whyLine,
  dishLine,
  onSelect,
  onToggleFavorite,
  onCardClick,
  layout = "desktop",
}: Props) {
  const [macrosOpen, setMacrosOpen] = useState(false);
  const scoreGlobal = getScoreGlobalDisplay(restaurant);
  const score =
    scoreGlobal != null
      ? scoreGlobal.toFixed(1)
      : displayHealthyScore(restaurant).toFixed(1);
  const exactMacroLine = getExactMacroLine(restaurant);
  const nutritionChips = getNutritionOrientationChips(restaurant);
  const rating = getDisplayRating(restaurant);
  const reviewCount = getDisplayReviewCount(restaurant);
  const hasCommander = canShowCommanderForRestaurant(restaurant);
  const isMobile = layout === "mobile";
  const signatureDish = getSignatureDishName(restaurant);

  return (
    <article
      onClick={onSelect}
      className={`group cursor-pointer rounded-2xl bg-white ring-1 transition duration-250 ease-out-expo hover:-translate-y-0.5 hover:shadow-elevated ${
        isActive ? "ring-brand/40 shadow-elevated" : "ring-ink/[0.06]"
      } ${isMobile ? "w-[300px] shrink-0 shadow-floating" : ""}`}
    >
      <div className={`flex gap-3 ${isMobile ? "p-2.5" : "p-2.5"}`}>
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-light">
          <RestaurantImage
            restaurant={restaurant}
            alt={restaurant.name}
            sizes="(max-width: 768px) 80px, 80px"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
            dishName={signatureDish}
          />
          <HeartButton
            active={isFavorite}
            onClick={onToggleFavorite}
            className="absolute right-1 top-1 h-7 w-7"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[13.5px] font-semibold tracking-tight text-ink">
              {restaurant.name}
            </h3>
            <span className="inline-flex h-5 shrink-0 items-center gap-0.5 rounded-full bg-brand px-1.5 text-[10.5px] font-semibold text-white">
              ● {score}
            </span>
          </div>

          {isMobile ? (
            <>
              <p className="truncate text-[11px] text-ink-mute">
                {distanceLabel ?? ""}
              </p>
              {hasCommander ? (
                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                  <CommanderLink
                    restaurant={restaurant}
                    analyticsSource="discover_mobile_card"
                    className="inline-flex h-8 w-full items-center justify-center rounded-full bg-brand px-3 text-[11px] font-semibold text-white"
                    showProviderBadge={false}
                  >
                    Commander
                  </CommanderLink>
                </div>
              ) : null}
              {exactMacroLine ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setMacrosOpen((v) => !v)}
                    className="text-[11px] font-semibold text-brand-deep underline-offset-2 hover:underline"
                  >
                    {macrosOpen ? "Masquer les macros" : "Macros du plat (menu)"}
                  </button>
                  {macrosOpen ? (
                    <p className="mt-0.5 text-[11px] text-ink/75">{exactMacroLine}</p>
                  ) : null}
                </div>
              ) : nutritionChips.length > 0 ? (
                <NutritionChipsRow chips={nutritionChips} size="sm" />
              ) : null}
            </>
          ) : (
            <>
              <p className="truncate text-[11px] text-ink-mute">
                {[distanceLabel, whyLine].filter(Boolean).join(" · ")}
              </p>
              {dishLine ? (
                <p className="truncate text-[11px] text-ink/70">{dishLine}</p>
              ) : null}
              {rating != null ? (
                <p className="text-[10.5px] text-ink/55">
                  ★ {rating.toFixed(1)}
                  {reviewCount != null && reviewCount > 0
                    ? ` (${reviewCount})`
                    : ""}
                </p>
              ) : null}
            </>
          )}

          <div className="mt-1 flex" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/restaurants/${restaurant.id}`}
              onClick={onCardClick}
              className="inline-flex h-7 w-full flex-1 items-center justify-center rounded-full bg-white px-2.5 text-[11px] font-semibold !text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
            >
              Voir
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function HeartButton({
  active,
  onClick,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-soft ring-1 ring-ink/[0.06] transition duration-250 ease-out-expo hover:scale-105 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill={active ? "#e0345b" : "none"}
        stroke={active ? "#e0345b" : "currentColor"}
        strokeWidth={1.8}
      >
        <path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.85A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10z" />
      </svg>
    </button>
  );
}
