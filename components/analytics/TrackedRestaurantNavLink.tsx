"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  trackRestaurantClick,
  type AnalyticsRestaurant,
} from "@/lib/analytics";
import type { RestaurantListItem } from "@/lib/types";

type Props = {
  href: string;
  restaurant: RestaurantListItem | AnalyticsRestaurant;
  /** Ex. `top_picks_strip`, `restaurant_grid` — utilisé tel quel dans PostHog. */
  placement: string;
  extra?: Record<string, unknown>;
  className?: string;
  children: ReactNode;
};

/** Lien vers une fiche resto avec `restaurant_card_clicked` (évite les `capture` dispersés). */
export default function TrackedRestaurantNavLink({
  href,
  restaurant,
  placement,
  extra,
  className,
  children,
}: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackRestaurantClick({
          restaurant: restaurant as AnalyticsRestaurant,
          surface: "card",
          placement,
          extra,
        })
      }
    >
      {children}
    </Link>
  );
}
