"use client";

import { useState } from "react";
import CommanderLink from "@/components/CommanderLink";
import NutritionChipsRow from "@/components/NutritionChipsRow";
import { canShowCommanderForRestaurant } from "@/lib/order-delivery-status";
import type { NutritionChip } from "@/lib/restaurant-credibility";
import type { RestaurantListItem } from "@/lib/types";

type Props = {
  restaurant: RestaurantListItem;
  dishName: string | null;
  categoryLabel: string | null;
  benefitTag: string | null;
  /** Macros exactes (4 valeurs DB) — une ligne, jamais partielle. */
  exactMacroLine: string | null;
  nutritionChips: NutritionChip[];
};

export default function RestaurantCardMobileDetails({
  restaurant,
  dishName,
  categoryLabel,
  benefitTag,
  exactMacroLine,
  nutritionChips,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasCommander = canShowCommanderForRestaurant(restaurant);

  if (
    !dishName &&
    !categoryLabel &&
    !benefitTag &&
    !exactMacroLine &&
    nutritionChips.length === 0 &&
    !hasCommander
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 md:hidden">
      {dishName ? (
        <p className="text-[12px] font-medium text-brand-deep">
          Plat phare · {dishName}
        </p>
      ) : categoryLabel ? (
        <p className="text-[12px] font-medium text-ink-soft">{categoryLabel}</p>
      ) : null}

      {benefitTag ? (
        <p className="text-[12px] text-ink/70">
          <span className="font-semibold text-brand-deep">Idéal pour · </span>
          {benefitTag}
        </p>
      ) : null}

      {!exactMacroLine && nutritionChips.length > 0 ? (
        <NutritionChipsRow chips={nutritionChips} />
      ) : null}

      {hasCommander ? (
        <CommanderLink
          restaurant={restaurant}
          analyticsSource="restaurant_card_mobile"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-brand px-4 text-[13px] font-semibold text-white"
          showProviderBadge={false}
        >
          Commander
        </CommanderLink>
      ) : null}

      {exactMacroLine ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-left text-[12px] font-semibold text-brand-deep"
          >
            {open ? "Masquer les macros" : "Macros du plat (menu)"}
          </button>
          {open ? (
            <p className="text-[12px] text-ink/75">{exactMacroLine}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
