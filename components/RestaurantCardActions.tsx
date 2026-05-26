"use client";

import TrackedRestaurantNavLink from "@/components/analytics/TrackedRestaurantNavLink";
import CommanderLink from "@/components/CommanderLink";
import RestaurantNavigateCTA from "@/components/RestaurantNavigateCTA";
import { canShowCommanderForRestaurant } from "@/lib/order-delivery-status";
import type { RestaurantListItem } from "@/lib/types";

export default function RestaurantCardActions({
  restaurant,
}: {
  restaurant: RestaurantListItem;
}) {
  const hasOrder = canShowCommanderForRestaurant(restaurant);

  return (
    <div className="flex flex-wrap gap-2 border-t border-ink/[0.06] px-5 pb-5 pt-4">
      {hasOrder ? (
        <CommanderLink
          restaurant={restaurant}
          analyticsSource="restaurant_card"
          className="inline-flex min-h-[44px] min-w-[100px] flex-1 items-center justify-center rounded-full bg-brand px-4 text-[13px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark active:translate-y-px"
        />
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
      <TrackedRestaurantNavLink
        href={`/restaurants/${restaurant.id}`}
        restaurant={restaurant}
        placement="restaurant_card_actions"
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-white px-4 text-[13px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
      >
        Voir
      </TrackedRestaurantNavLink>
    </div>
  );
}
