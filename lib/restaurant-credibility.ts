import {
  effectiveCalorieBand,
  effectiveCleanBand,
  effectiveProteinBand,
  hasSignatureDishMacros,
} from "@/lib/restaurant-helpers";
import type { Restaurant, RestaurantListItem } from "@/lib/types";

/** Badge « vérifié » — colonne éditoriale uniquement (pas d’heuristique). */
export function isVerified(
  restaurant: RestaurantListItem | Restaurant
): boolean {
  return restaurant.verified_by_healthyhub === true;
}

export type MenuMacros = {
  kcal: string;
  protein: string;
  carbs: string;
  fat: string;
};

/**
 * Macros du plat signature — uniquement si les 4 valeurs sont en base (menu réel).
 */
export function getMenuMacros(
  restaurant: RestaurantListItem | Restaurant
): MenuMacros | null {
  if (!hasSignatureDishMacros(restaurant)) return null;

  const k = Number(restaurant.signature_dish_calories);
  const p = Number(restaurant.signature_dish_protein);
  const c = Number(restaurant.signature_dish_carbs);
  const f = Number(restaurant.signature_dish_fats);
  return {
    kcal: `${Math.round(k)}`,
    protein: `${Math.round(p)}g`,
    carbs: `${Math.round(c)}g`,
    fat: `${Math.round(f)}g`,
  };
}

/**
 * Chips nutritionnelles qualitatives — colonnes DB uniquement (protein_level, etc.).
 * Jamais de chiffres exacts : "Riche en protéines" pas "32g protéines".
 * Source : données réelles, framing éditorial.
 */
export type NutritionChip = { label: string };

export function getNutritionOrientationChips(
  restaurant: RestaurantListItem | Restaurant
): NutritionChip[] {
  const chips: NutritionChip[] = [];
  const protein = effectiveProteinBand(restaurant as RestaurantListItem);
  const cal = effectiveCalorieBand(restaurant as Restaurant);
  const clean = effectiveCleanBand(restaurant as RestaurantListItem);

  if (protein === "high") chips.push({ label: "Riche en protéines" });
  if (cal === "low") chips.push({ label: "Peu calorique" });
  else if (cal === "high") chips.push({ label: "Calorique" });
  if (clean === "high") chips.push({ label: "Très clean" });

  return chips;
}

/**
 * Fourchette calorique par catégorie — affichée uniquement quand ni macros DB
 * ni colonnes nutritionnelles ne sont disponibles.
 * Toujours préfixé "~" et libellé "Estimation catégorie".
 */
export function getCategoryCalorieRange(
  restaurant: RestaurantListItem | Restaurant
): string | null {
  const cat = ((restaurant as RestaurantListItem).category ?? "").toLowerCase();
  if (cat.includes("poke"))    return "~480–560 kcal";
  if (cat.includes("salad") || cat.includes("salade")) return "~350–450 kcal";
  if (cat.includes("vegan"))   return "~450–550 kcal";
  if (cat.includes("protein")) return "~550–650 kcal";
  if (cat.includes("brunch"))  return "~600–750 kcal";
  if (cat.includes("burger"))  return "~650–780 kcal";
  if (cat.includes("juice") || cat.includes("matcha")) return "~180–300 kcal";
  if (cat.includes("bowl"))    return "~480–600 kcal";
  return null;
}

/** @deprecated Utiliser `getMenuMacros`. */
export function estimateMacros(
  restaurant: RestaurantListItem | Restaurant
): (MenuMacros & { confidence: "from_menu" }) | null {
  const macros = getMenuMacros(restaurant);
  if (!macros) return null;
  return { ...macros, confidence: "from_menu" };
}
