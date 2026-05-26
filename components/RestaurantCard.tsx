import TrackedRestaurantNavLink from "@/components/analytics/TrackedRestaurantNavLink";
import { getDisplayRating, getDisplayReviewCount } from "@/lib/restaurant-helpers";
import type { RestaurantListItem } from "@/lib/types";
import RestaurantCardActions from "@/components/RestaurantCardActions";
import { displayHealthyScore } from "@/lib/healthy-score";
import {
  getBenefitTag,
  getServiceModeLabels,
} from "@/lib/restaurant-presentation";
import RestaurantImage from "@/components/RestaurantImage";
import VerifiedBadge from "@/components/VerifiedBadge";
import SocialProof from "@/components/SocialProof";
import { isVerified } from "@/lib/restaurant-credibility";
import RestaurantCardHeart from "@/components/RestaurantCardHeart";
import RestaurantCardMobileDetails from "@/components/RestaurantCardMobileDetails";
import {
  getPrimarySignatureMacroLine,
  getScoreGlobalDisplay,
  isNewRestaurantThisWeek,
} from "@/lib/restaurant-card-display";

export default function RestaurantCard({
  restaurant,
}: {
  restaurant: RestaurantListItem;
}) {
  const serviceLabels = getServiceModeLabels(restaurant);
  const scoreGlobal = getScoreGlobalDisplay(restaurant);
  const macroLine = getPrimarySignatureMacroLine(restaurant);
  const isNew = isNewRestaurantThisWeek(restaurant);

  return (
    <div className="group flex flex-col overflow-hidden rounded-[28px] bg-white shadow-soft ring-1 ring-ink/[0.06] transition duration-250 ease-out-expo hover:-translate-y-0.5 hover:shadow-floating hover:ring-brand/30">
      <div className="relative">
        <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-2">
          <RestaurantCardHeart restaurantId={restaurant.id} />
          <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow-soft">
            {scoreGlobal != null ? (
              <>
                <span className="opacity-90">●</span>
                {scoreGlobal.toFixed(1)} global
              </>
            ) : (
              <>
                ● {displayHealthyScore(restaurant).toFixed(1)} healthy
              </>
            )}
          </span>
        </div>
        <TrackedRestaurantNavLink
          href={`/restaurants/${restaurant.id}`}
          restaurant={restaurant}
          placement="restaurant_grid"
          className="block"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-light">
            <RestaurantImage
              restaurant={restaurant}
              alt={restaurant.name}
              sizes="(max-width: 768px) 100vw, 33vw"
              className="h-full w-full object-cover transition duration-500 ease-out-expo group-hover:scale-[1.04]"
            />

            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
              {isNew ? (
                <span className="rounded-full bg-brand-dark px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white shadow-soft">
                  Nouveau
                </span>
              ) : null}
              {restaurant.city ? (
                <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-deep shadow-soft backdrop-blur">
                  {restaurant.city}
                </span>
              ) : null}
              {isVerified(restaurant) ? <VerifiedBadge /> : null}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-2 p-5 pb-3">
            <h3 className="text-[17px] font-semibold tracking-tight text-ink">
              {restaurant.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white md:hidden">
                ●{" "}
                {(scoreGlobal ?? displayHealthyScore(restaurant)).toFixed(1)}
              </span>
              <span className="hidden md:inline">
                <RatingLine
                  rating={getDisplayRating(restaurant)}
                  count={getDisplayReviewCount(restaurant)}
                />
              </span>
            </div>

            <RestaurantCardMobileDetails
              restaurant={restaurant}
              tag={getBenefitTag(restaurant.category)}
              macroLine={macroLine}
            />

            <div className="hidden flex-col gap-2 md:flex">
              {macroLine ? (
                <p className="text-[12px] font-medium text-brand-deep">
                  Plat phare · {macroLine}
                </p>
              ) : null}
              <p className="text-[12.5px] leading-snug text-ink/75">
                <span className="font-semibold text-brand-deep">Pourquoi · </span>
                {getBenefitTag(restaurant.category)}
              </p>
              {restaurant.cuisine ? (
                <p className="text-[13px] text-ink-mute">{restaurant.cuisine}</p>
              ) : null}
              <SocialProof restaurant={restaurant} showRating={false} />
              {serviceLabels.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {serviceLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full border border-brand/20 bg-brand-light/90 px-2.5 py-0.5 text-[10px] font-semibold text-brand-deep"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}

              {restaurant.tags && restaurant.tags.length > 0 ? (
                <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
                  {restaurant.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-medium text-brand-deep"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </TrackedRestaurantNavLink>
      </div>
      <RestaurantCardActions restaurant={restaurant} />
    </div>
  );
}

function RatingLine({
  rating,
  count,
}: {
  rating: number | null;
  count: number | null;
}) {
  if (rating == null) return null;
  return (
    <span className="font-semibold text-ink/70">
      ★ {rating.toFixed(1)}
      {count != null && count > 0 ? (
        <span className="font-medium text-ink/45"> ({count})</span>
      ) : null}
    </span>
  );
}
