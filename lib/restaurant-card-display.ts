import { getMenuMacros } from "@/lib/restaurant-credibility";
import { hasSignatureDishMacros } from "@/lib/restaurant-helpers";
import type { RestaurantListItem } from "@/lib/types";

const NEW_DAYS = 7;

export function getScoreGlobalDisplay(
  restaurant: RestaurantListItem
): number | null {
  const g = restaurant.score_global;
  if (g != null && Number.isFinite(Number(g))) return Number(g);
  return null;
}

/**
 * Résumé macro une ligne — uniquement si les 4 valeurs sont en base.
 * Jamais de macro partielle (ex. protéines seules).
 */
export function getExactMacroLine(restaurant: RestaurantListItem): string | null {
  if (!hasSignatureDishMacros(restaurant)) return null;
  const macros = getMenuMacros(restaurant);
  if (!macros) return null;
  return `${macros.kcal} kcal · ${macros.protein} · ${macros.carbs} · ${macros.fat}`;
}

/** @deprecated Utiliser `getExactMacroLine` — ne plus afficher de macro partielle. */
export function getPrimarySignatureMacroLine(
  restaurant: RestaurantListItem
): string | null {
  return getExactMacroLine(restaurant);
}

export function isNewRestaurantThisWeek(
  restaurant: RestaurantListItem
): boolean {
  if (!restaurant.created_at) return false;
  const t = new Date(restaurant.created_at).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < NEW_DAYS * 24 * 60 * 60 * 1000;
}
