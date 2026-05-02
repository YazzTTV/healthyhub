"use client";

import Link from "next/link";
import RestaurantNavigateCTA from "@/components/RestaurantNavigateCTA";
import type { RestaurantListItem } from "@/lib/types";

export default function RestaurantCardActions({
  restaurant,
}: {
  restaurant: RestaurantListItem;
}) {
  const hasOrder = Boolean(restaurant.uber_eats_url || restaurant.deliveroo_url);

  return (
    <div className="flex flex-wrap gap-2 border-t border-ink/[0.06] px-5 pb-5 pt-4">
      {hasOrder ? (
        <a
          href={restaurant.uber_eats_url || restaurant.deliveroo_url || "#"}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] min-w-[100px] flex-1 items-center justify-center rounded-full bg-brand px-4 text-[13px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark active:translate-y-px"
        >
          Commander
        </a>
      ) : null}
      <RestaurantNavigateCTA
        restaurant={restaurant}
        source="restaurant_card"
        hasOrderLinks={hasOrder}
        size="md"
        showDistance
        className="min-w-[100px] flex-1 flex-col"
        buttonClassName="w-full"
      />
      <Link
        href={`/restaurants/${restaurant.id}`}
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
      >
        Voir
      </Link>
    </div>
  );
}
