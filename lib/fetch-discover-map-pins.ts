import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeRestaurantRow } from "@/lib/normalize-restaurant-row";
import type { RestaurantListItem } from "@/lib/types";

/** Champs minimaux pour marqueurs carte (léger vs liste complète). */
const MAP_PIN_SELECT =
  "id,name,slug,category,city,latitude,longitude,healthy_score,restaurant_image_url,restaurant_interior_image_url,storefront_image_url,image_url,image_status,signature_dish,signature_dish_image_url,rating,google_rating,google_review_count,verified_by_healthyhub";

const MAP_PIN_SELECT_LEGACY =
  "id,name,slug,category,city,latitude,longitude,healthy_score,image_url,image_status,rating,google_rating,google_review_count,verified_by_healthyhub";

function isRecoverableColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("column") ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("relationship")
  );
}

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
  | "restaurant_image_url"
  | "restaurant_interior_image_url"
  | "storefront_image_url"
  | "image_url"
  | "image_status"
  | "signature_dish_name"
  | "signature_dish_image_url"
  | "rating"
  | "google_rating"
  | "google_review_count"
  | "verified_by_healthyhub"
>;

function mapPins(
  rows: unknown[],
  includeSignatureImage: boolean
): DiscoverMapPin[] {
  return (rows ?? []).map((row) => {
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
      restaurant_image_url: r.restaurant_image_url ?? null,
      restaurant_interior_image_url: r.restaurant_interior_image_url ?? null,
      storefront_image_url: r.storefront_image_url ?? null,
      image_url: r.image_url,
      image_status: r.image_status,
      signature_dish_name: includeSignatureImage
        ? r.signature_dish_name ?? null
        : null,
      signature_dish_image_url: includeSignatureImage
        ? r.signature_dish_image_url ?? null
        : null,
      rating: r.rating,
      google_rating: r.google_rating,
      google_review_count: r.google_review_count,
      verified_by_healthyhub: r.verified_by_healthyhub,
    };
  });
}

export async function fetchDiscoverMapPins(
  client: SupabaseClient
): Promise<{ data: DiscoverMapPin[]; error: string | null }> {
  const firstQuery = await client
    .from("restaurants")
    .select(MAP_PIN_SELECT)
    .order("healthy_score", { ascending: false, nullsFirst: false });
  let dataRows = (firstQuery.data ?? null) as unknown[] | null;
  let error = firstQuery.error;

  let includeSignature = true;
  if (error && isRecoverableColumnError(error.message)) {
    const retry = await client
      .from("restaurants")
      .select(MAP_PIN_SELECT_LEGACY)
      .order("healthy_score", { ascending: false, nullsFirst: false });
    dataRows = (retry.data ?? null) as unknown[] | null;
    error = retry.error;
    includeSignature = false;
  }

  if (error) {
    return { data: [], error: error.message };
  }

  return {
    data: mapPins(dataRows ?? [], includeSignature),
    error: null,
  };
}
