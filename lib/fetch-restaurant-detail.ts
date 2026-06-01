import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RESTAURANT_SELECT_BASE,
  RESTAURANT_SELECT_CORE,
  RESTAURANT_SELECT_ENRICHED_EMBED,
  RESTAURANT_SELECT_ENRICHED_FLAT,
  RESTAURANT_SELECT_FULL,
} from "@/lib/restaurant-select";
import { normalizeRestaurantRow } from "@/lib/normalize-restaurant-row";
import type { RestaurantListItem } from "@/lib/types";

const SELECT_ATTEMPTS = [
  RESTAURANT_SELECT_ENRICHED_EMBED,
  RESTAURANT_SELECT_ENRICHED_FLAT,
  RESTAURANT_SELECT_FULL,
  RESTAURANT_SELECT_CORE,
  RESTAURANT_SELECT_BASE,
];

function isRecoverableColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("column") ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("relationship")
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRestaurantUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function fetchRestaurantByIdOrSlug(
  client: SupabaseClient,
  idOrSlug: string
): Promise<RestaurantListItem | null> {
  if (isRestaurantUuid(idOrSlug)) {
    for (const select of SELECT_ATTEMPTS) {
      const { data, error } = await client
        .from("restaurants")
        .select(select)
        .eq("id", idOrSlug)
        .maybeSingle();
      if (!error && data) return normalizeRestaurantRow(data);
      if (error && !isRecoverableColumnError(error.message)) {
        console.error("[restaurant] fetch by id:", error.message);
        return null;
      }
    }
  }

  for (const select of SELECT_ATTEMPTS) {
    const { data, error } = await client
      .from("restaurants")
      .select(select)
      .eq("slug", idOrSlug)
      .maybeSingle();
    if (!error && data) return normalizeRestaurantRow(data);
    if (error && !isRecoverableColumnError(error.message)) {
      console.error("[restaurant] fetch by slug:", error.message);
      return null;
    }
  }

  return null;
}
