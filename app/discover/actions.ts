"use server";

import { DISCOVER_PAGE_SIZE } from "@/lib/discover-constants";
import { fetchRestaurantListRows } from "@/lib/fetch-restaurant-list";
import { supabase } from "@/lib/supabase";
import type { RestaurantListItem } from "@/lib/types";

export type LoadDiscoverPageResult = {
  restaurants: RestaurantListItem[];
  page: number;
  totalCount: number;
  hasMore: boolean;
  error: string | null;
};

/** Charge une page Discover depuis Supabase (tri score healthy par défaut). */
export async function loadDiscoverRestaurantsPage(
  page: number
): Promise<LoadDiscoverPageResult> {
  const safePage = Math.max(1, Math.floor(page));
  const offset = (safePage - 1) * DISCOVER_PAGE_SIZE;

  const { data, error, totalCount } = await fetchRestaurantListRows(supabase, {
    limit: DISCOVER_PAGE_SIZE,
    offset,
    withCount: true,
  });

  const total = totalCount ?? data.length;
  const hasMore = offset + data.length < total;

  return {
    restaurants: data,
    page: safePage,
    totalCount: total,
    hasMore,
    error,
  };
}

/** Catalogue complet pour filtres carte (hors HTML initial). */
export async function fetchDiscoverCatalogAction(): Promise<{
  restaurants: RestaurantListItem[];
  error: string | null;
}> {
  const { data, error } = await fetchRestaurantListRows(supabase, {});
  return { restaurants: data, error };
}
