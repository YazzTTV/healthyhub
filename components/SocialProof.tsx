import { getDisplayRating, getDisplayReviewCount } from "@/lib/restaurant-helpers";
import type { RestaurantListItem } from "@/lib/types";

/** Notes Google / plateforme — pas de compteurs ni comportements utilisateur fabriqués. */
export default function SocialProof({
  restaurant,
  showRating = true,
}: {
  restaurant: RestaurantListItem;
  /** Sur les cartes, la note est déjà affichée ailleurs — éviter le doublon. */
  showRating?: boolean;
}) {
  const unifiedRating = getDisplayRating(restaurant);
  const unifiedCount = getDisplayReviewCount(restaurant);
  const isGooglePrimary =
    restaurant.google_rating != null &&
    Number.isFinite(Number(restaurant.google_rating));

  if (!showRating || unifiedRating == null) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-mute">
      <span className="inline-flex items-center gap-1">
        <span className="h-1 w-1 rounded-full bg-ink/30" aria-hidden />
        <span>
          {isGooglePrimary ? "Google " : ""}★{" "}
          <span className="font-semibold text-ink-soft">
            {unifiedRating.toFixed(1)}
          </span>
          {unifiedCount != null && unifiedCount > 0 ? (
            <span className="font-medium text-ink/45">
              {" "}
              ({unifiedCount} avis)
            </span>
          ) : null}
        </span>
      </span>
    </div>
  );
}
