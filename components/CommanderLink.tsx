"use client";

import type { ReactNode } from "react";
import {
  getBestOrderLink,
  ORDER_PROVIDER_LABELS,
  type OrderProvider,
} from "@/lib/order-links";
import { trackCommanderClick, type AnalyticsRestaurant } from "@/lib/analytics";
import type { RestaurantListItem } from "@/lib/types";

type Props = {
  restaurant: Pick<
    RestaurantListItem,
    | "id"
    | "name"
    | "slug"
    | "category"
    | "arrondissement"
    | "healthy_score"
    | "city"
    | "uber_eats_url"
    | "uber_eats_status"
    | "deliveroo_url"
    | "deliveroo_status"
  >;
  className?: string;
  showProviderBadge?: boolean;
  /** Contexte analytics (ex. best_choice, restaurant_card). */
  analyticsSource?: string;
  onClick?: (provider: OrderProvider) => void;
  children?: ReactNode;
};

export default function CommanderLink({
  restaurant,
  className = "",
  showProviderBadge = true,
  analyticsSource = "commander_link",
  onClick,
  children = "Commander",
}: Props) {
  const link = getBestOrderLink(restaurant);
  if (!link) return null;

  const handleClick = () => {
    trackCommanderClick(
      restaurant as AnalyticsRestaurant,
      link.provider,
      analyticsSource
    );
    onClick?.(link.provider);
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      <span className="inline-flex items-center gap-1.5">
        {children}
        {showProviderBadge ? (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
            {ORDER_PROVIDER_LABELS[link.provider]}
          </span>
        ) : null}
      </span>
    </a>
  );
}
