"use client";

import { useState } from "react";
import CommanderLink from "@/components/CommanderLink";
import { canShowCommanderForRestaurant } from "@/lib/order-delivery-status";
import type { RestaurantListItem } from "@/lib/types";

type Props = {
  restaurant: RestaurantListItem;
  tag: string;
  macroLine: string | null;
};

/** Version mobile épurée : nom/score/tag déjà affichés ; macros au tap. */
export default function RestaurantCardMobileDetails({
  restaurant,
  tag,
  macroLine,
}: Props) {
  const [open, setOpen] = useState(false);
  const hasCommander = canShowCommanderForRestaurant(restaurant);

  return (
    <div className="flex flex-col gap-2 md:hidden">
      <p className="text-[12.5px] text-ink/75">
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-deep">
          {tag}
        </span>
      </p>
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
      {macroLine ? (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-left text-[12px] font-semibold text-brand-deep"
          >
            {open ? "Masquer les macros" : "Macros du plat"}
          </button>
          {open ? (
            <p className="text-[12px] text-ink/75">Plat phare · {macroLine}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
