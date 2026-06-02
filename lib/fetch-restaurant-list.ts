import type { SupabaseClient } from "@supabase/supabase-js";
import {
  RESTAURANT_SELECT_BASE,
  RESTAURANT_SELECT_BASE_LEGACY,
  RESTAURANT_SELECT_CORE,
  RESTAURANT_SELECT_CORE_LEGACY,
  RESTAURANT_SELECT_ENRICHED_EMBED,
  RESTAURANT_SELECT_ENRICHED_EMBED_LEGACY,
  RESTAURANT_SELECT_ENRICHED_FLAT,
  RESTAURANT_SELECT_ENRICHED_FLAT_LEGACY,
  RESTAURANT_SELECT_FULL,
  RESTAURANT_SELECT_FULL_LEGACY,
} from "@/lib/restaurant-select";
import { normalizeRestaurantRow } from "@/lib/normalize-restaurant-row";
import type { RestaurantListItem } from "@/lib/types";

type OrderOpts = { ascending?: boolean; nullsFirst?: boolean };

const SELECT_ATTEMPTS = [
  RESTAURANT_SELECT_ENRICHED_EMBED,
  RESTAURANT_SELECT_ENRICHED_FLAT,
  RESTAURANT_SELECT_FULL,
  RESTAURANT_SELECT_CORE,
  RESTAURANT_SELECT_BASE,
  RESTAURANT_SELECT_ENRICHED_EMBED_LEGACY,
  RESTAURANT_SELECT_ENRICHED_FLAT_LEGACY,
  RESTAURANT_SELECT_FULL_LEGACY,
  RESTAURANT_SELECT_CORE_LEGACY,
  RESTAURANT_SELECT_BASE_LEGACY,
];

function mapRows(data: unknown[] | null): RestaurantListItem[] {
  return (data ?? []).map((row) => normalizeRestaurantRow(row));
}

export async function fetchRestaurantListRows(
  client: SupabaseClient,
  options: {
    orderColumn?: string;
    order?: OrderOpts;
    limit?: number;
    offset?: number;
    /** Inclut le décompte total (pour pagination). */
    withCount?: boolean;
  } = {}
): Promise<{
  data: RestaurantListItem[];
  error: string | null;
  totalCount?: number;
}> {
  const orderColumn = options.orderColumn ?? "healthy_score";
  const order: OrderOpts = options.order ?? {
    ascending: false,
    nullsFirst: false,
  };
  const { limit, offset, withCount } = options;

  let lastErr: string | null = null;

  for (const select of SELECT_ATTEMPTS) {
    let q = client
      .from("restaurants")
      .select(select, withCount ? { count: "exact" } : undefined)
      .order(orderColumn, order);
    if (offset != null && limit != null) {
      q = q.range(offset, offset + limit - 1);
    } else if (limit != null) {
      q = q.limit(limit);
    }
    const { data, error, count } = await q;
    if (!error) {
      return {
        data: mapRows(data as unknown[]),
        error: null,
        ...(withCount ? { totalCount: count ?? undefined } : {}),
      };
    }
    lastErr = error.message;
    const m = error.message.toLowerCase();
    if (
      !m.includes("column") &&
      !m.includes("does not exist") &&
      !m.includes("relationship") &&
      !m.includes("schema cache")
    ) {
      return { data: [], error: lastErr };
    }
  }

  return { data: [], error: lastErr };
}

/** Favoris / listes par ids — sans `order` imposé (ordre réappliqué côté client si besoin). */
export async function fetchRestaurantsByIds(
  client: SupabaseClient,
  ids: string[]
): Promise<RestaurantListItem[]> {
  if (ids.length === 0) return [];

  for (const select of SELECT_ATTEMPTS) {
    const { data, error } = await client
      .from("restaurants")
      .select(select)
      .in("id", ids);
    if (!error) return mapRows(data as unknown[]);
    const m = error.message.toLowerCase();
    if (!m.includes("column") && !m.includes("does not exist")) break;
  }

  return [];
}
