import Link from "next/link";
import type { RestaurantListItem } from "@/lib/types";

export default function RestaurantCard({
  restaurant,
}: {
  restaurant: RestaurantListItem;
}) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand/30"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-light">
        {restaurant.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🥗
          </div>
        )}
        {restaurant.city ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink shadow-sm backdrop-blur">
            {restaurant.city}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-semibold tracking-tight text-ink">
          {restaurant.name}
        </h3>
        {restaurant.cuisine ? (
          <p className="text-sm text-ink/60">{restaurant.cuisine}</p>
        ) : null}

        {restaurant.tags && restaurant.tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
            {restaurant.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-brand-light px-2.5 py-0.5 text-xs font-medium text-brand-dark"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
