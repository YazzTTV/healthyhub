import type { RestaurantListItem } from "@/lib/types";

const NEW_DAYS = 7;

export function getScoreGlobalDisplay(
  restaurant: RestaurantListItem
): number | null {
  const g = restaurant.score_global;
  if (g != null && Number.isFinite(Number(g))) return Number(g);
  return null;
}

/** Texte court pour une macro du plat signature (priorité protéines → kcal → glucides → lipides). */
export function getPrimarySignatureMacroLine(
  restaurant: RestaurantListItem
): string | null {
  const p = restaurant.signature_dish_protein;
  if (p != null && Number.isFinite(Number(p))) {
    return `${Math.round(Number(p))} g protéines`;
  }
  const cal = restaurant.signature_dish_calories;
  if (cal != null && Number.isFinite(Number(cal))) {
    return `${Math.round(Number(cal))} kcal`;
  }
  const c = restaurant.signature_dish_carbs;
  if (c != null && Number.isFinite(Number(c))) {
    return `${Math.round(Number(c))} g glucides`;
  }
  const f = restaurant.signature_dish_fats;
  if (f != null && Number.isFinite(Number(f))) {
    return `${Math.round(Number(f))} g lipides`;
  }
  return null;
}

export function isNewRestaurantThisWeek(
  restaurant: RestaurantListItem
): boolean {
  if (!restaurant.created_at) return false;
  const t = new Date(restaurant.created_at).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < NEW_DAYS * 24 * 60 * 60 * 1000;
}
