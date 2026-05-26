import type { Restaurant, RestaurantListItem } from "@/lib/types";

export type NutritionBand = "low" | "medium" | "high";

/** Normalise une valeur texte éventuelle venant de Postgres. */
export function normalizeNutritionBand(
  v: string | NutritionBand | null | undefined
): NutritionBand | null {
  if (v == null) return null;
  const x = String(v).toLowerCase().trim();
  if (["low", "léger", "leger", "faible", "light"].includes(x)) return "low";
  if (["high", "élevé", "eleve", "dense"].includes(x)) return "high";
  if (["medium", "modéré", "modere", "moyen", "moderate"].includes(x))
    return "medium";
  return null;
}

/** Priorité : `calorie_density` (nouvelle base) puis `calorie_level` (legacy). */
export function effectiveCalorieBand(
  r: Pick<Restaurant, "calorie_density" | "calorie_level">
): NutritionBand | null {
  return (
    normalizeNutritionBand(r.calorie_density) ??
    normalizeNutritionBand(r.calorie_level) ??
    (r.calorie_level as NutritionBand | null) ??
    (r.calorie_density as NutritionBand | null) ??
    null
  );
}

export function effectiveProteinBand(
  r: Pick<Restaurant, "protein_level">
): NutritionBand | null {
  return normalizeNutritionBand(r.protein_level) ?? (r.protein_level as NutritionBand | null) ?? null;
}

export function effectiveCleanBand(
  r: Pick<Restaurant, "clean_level">
): NutritionBand | null {
  return normalizeNutritionBand(r.clean_level) ?? (r.clean_level as NutritionBand | null) ?? null;
}

export function getDisplayRating(r: RestaurantListItem): number | null {
  const g = r.google_rating;
  if (g != null && Number.isFinite(Number(g))) return Number(g);
  const x = r.rating;
  if (x != null && Number.isFinite(Number(x))) return Number(x);
  return null;
}

export function getDisplayReviewCount(r: RestaurantListItem): number | null {
  const g = r.google_review_count;
  if (g != null && Number.isFinite(Number(g)) && Number(g) > 0) return Math.round(Number(g));
  const x = r.review_count;
  if (x != null && Number.isFinite(Number(x)) && Number(x) > 0) return Math.round(Number(x));
  return null;
}

export function hasSignatureDishMacros(r: RestaurantListItem): boolean {
  return (
    r.signature_dish_calories != null &&
    Number.isFinite(Number(r.signature_dish_calories)) &&
    r.signature_dish_protein != null &&
    Number.isFinite(Number(r.signature_dish_protein)) &&
    r.signature_dish_carbs != null &&
    Number.isFinite(Number(r.signature_dish_carbs)) &&
    r.signature_dish_fats != null &&
    Number.isFinite(Number(r.signature_dish_fats))
  );
}

export function isValidMapCoordinates(
  lat: unknown,
  lng: unknown
): boolean {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false;
  if (Math.abs(la) > 90 || Math.abs(lo) > 180) return false;
  if (Math.abs(la) < 1e-7 && Math.abs(lo) < 1e-7) return false;
  return true;
}

export function formatParisLocationLine(r: RestaurantListItem): string | null {
  const parts = [r.full_address, r.arrondissement, r.postal_code, r.city]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  if (parts.length === 0) return null;
  const uniq = [...new Set(parts)];
  return uniq.slice(0, 2).join(" · ");
}
