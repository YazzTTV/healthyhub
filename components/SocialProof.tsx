import type { RestaurantListItem } from "@/lib/types";
import { getOftenChosenFor, getSavedCount } from "@/lib/social-proof";

export default function SocialProof({
  restaurant,
}: {
  restaurant: RestaurantListItem;
}) {
  const saved = getSavedCount(restaurant);
  const chosenFor = getOftenChosenFor(restaurant);

  if (saved == null && !chosenFor) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-mute">
      {saved != null ? (
        <span className="inline-flex items-center gap-1">
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3 text-brand-deep"
            fill="currentColor"
          >
            <path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.85A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10z" />
          </svg>
          <span>
            <span className="font-semibold text-ink-soft">
              {saved.toLocaleString("fr-FR")}
            </span>{" "}
            sauvegardes
          </span>
        </span>
      ) : null}
      {chosenFor ? (
        <span className="inline-flex items-center gap-1">
          <span className="h-1 w-1 rounded-full bg-ink/30" aria-hidden />
          <span>
            Souvent choisi pour{" "}
            <span className="font-semibold text-brand-deep">{chosenFor}</span>
          </span>
        </span>
      ) : null}
    </div>
  );
}
