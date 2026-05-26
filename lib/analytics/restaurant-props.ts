import type { RestaurantListItem } from "@/lib/types";

export type AnalyticsRestaurant = Pick<
  RestaurantListItem,
  "id" | "name" | "slug" | "category" | "arrondissement" | "healthy_score" | "city"
>;

export function restaurantAnalyticsProps(
  restaurant: AnalyticsRestaurant,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  return {
    restaurant_name: restaurant.name,
    restaurant_slug: restaurant.slug ?? null,
    category: restaurant.category ?? null,
    arrondissement: restaurant.arrondissement ?? null,
    city: restaurant.city ?? null,
    healthy_score:
      restaurant.healthy_score != null
        ? Number(restaurant.healthy_score)
        : null,
    ...extra,
  };
}

/** Entrée « récemment vu » → champs analytics restaurant (sans aller en base). */
export function recentlyViewedEntryToAnalytics(entry: {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
}): AnalyticsRestaurant {
  return {
    id: entry.id,
    name: entry.name,
    slug: null,
    category: entry.category,
    arrondissement: null,
    healthy_score: null,
    city: entry.city,
  };
}
