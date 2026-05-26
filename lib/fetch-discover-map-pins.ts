import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRestaurantRow } from "@/lib/normalize-restaurant-row";
import type { RestaurantListItem } from "@/lib/types";

/** Champs minimaux pour marqueurs carte (léger vs liste complète). */
const MAP_PIN_SELECT =
  "id,name,slug,category,city,latitude,longitude,healthy_score,image_url,image_status,rating,google_rating,google_review_count,verified_by_healthyhub";

export type DiscoverMapPin = Pick<
  RestaurantListItem,
  | "id"
  | "name"
  | "slug"
  | "category"
  | "city"
  | "latitude"
  | "longitude"
  | "healthy_score"
  | "image_url"
  | "image_status"
  | "rating"
  | "google_rating"
  | "google_review_count"
  | "verified_by_healthyhub"
>;

export async function fetchDiscoverMapPins(
  client: SupabaseClient
): Promise<{ data: DiscoverMapPin[]; error: string | null }> {
  const { data, error } = await client
    .from("restaurants")
    .select(MAP_PIN_SELECT)
    .order("healthy_score", { ascending: false, nullsFirst: false });

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: (data ?? []).map((row) => {
      const r = normalizeRestaurantRow(row);
      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        category: r.category,
        city: r.city,
        latitude: r.latitude,
        longitude: r.longitude,
        healthy_score: r.healthy_score,
        image_url: r.image_url,
        image_status: r.image_status,
        rating: r.rating,
        google_rating: r.google_rating,
        google_review_count: r.google_review_count,
        verified_by_healthyhub: r.verified_by_healthyhub,
      };
    }),
    error: null,
  };
}
