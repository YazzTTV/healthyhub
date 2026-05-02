"use client";

import { supabase } from "@/lib/supabase";
import type { RestaurantListItem } from "@/lib/types";

export type HistoryAction =
  | "viewed_restaurant"
  | "clicked_order_ubereats"
  | "clicked_order_deliveroo"
  | "clicked_marker"
  | "clicked_card";

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserFavorites(userId: string) {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("restaurant_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addFavorite(userId: string, restaurantId: string) {
  const { error } = await supabase
    .from("user_favorites")
    .upsert({ user_id: userId, restaurant_id: restaurantId }, { onConflict: "user_id,restaurant_id" });
  if (error) throw error;
}

export async function removeFavorite(userId: string, restaurantId: string) {
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("restaurant_id", restaurantId);
  if (error) throw error;
}

export function isFavorite(restaurantId: string, favoriteIds: string[]) {
  return favoriteIds.includes(restaurantId);
}

export async function getFavoriteRestaurants(userId: string) {
  const favorites = await getUserFavorites(userId);
  const ids = favorites.map((f) => f.restaurant_id);
  if (ids.length === 0) return [] as RestaurantListItem[];

  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id, slug, name, image_url, city, cuisine, category, healthy_score, tags, latitude, longitude, rating, review_count, uber_eats_url, deliveroo_url"
    )
    .in("id", ids);

  if (error) throw error;

  const byId = new Map((data ?? []).map((r) => [r.id, r as RestaurantListItem]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as RestaurantListItem[];
}

export async function trackUserHistory(
  action: HistoryAction,
  restaurantId: string,
  metadata?: Record<string, unknown>
) {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    await supabase.from("user_history").insert({
      user_id: user.id,
      restaurant_id: restaurantId,
      action,
      metadata: metadata ?? null,
    });
  } catch {
    // Never block UX for history tracking.
  }
}

export async function getUserHistory(userId: string) {
  const { data, error } = await supabase
    .from("user_history")
    .select("id, restaurant_id, action, metadata, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data ?? [];
}
