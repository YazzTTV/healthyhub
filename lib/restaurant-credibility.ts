import { displayHealthyScore } from "@/lib/healthy-score";
import type { Restaurant, RestaurantListItem } from "@/lib/types";

/**
 * Verified by HealthyHub badge.
 * For now: based on score >= 4.5 + presence of structured metadata.
 * Later: backed by an `is_verified` column when editorial team has visited.
 */
export function isVerified(
  restaurant: RestaurantListItem | Restaurant
): boolean {
  const score = displayHealthyScore(restaurant);
  if (score < 4.5) return false;
  const hasMeta =
    !!(restaurant as Restaurant).description ||
    !!restaurant.cuisine ||
    (restaurant.tags?.length ?? 0) > 0;
  return hasMeta;
}

type EstimatedMacros = {
  kcal: string; // "~480"
  protein: string; // "32g"
  carbs: string; // "45g"
  fat: string; // "14g"
  confidence: "estimated" | "approximated";
};

/**
 * Estimated macros for the signature dish.
 * Heuristic (clearly labeled "estimé") based on category + nutrition profile.
 * NOT a substitute for actual labeling.
 */
export function estimateMacros(
  restaurant: RestaurantListItem | Restaurant
): EstimatedMacros | null {
  const category = (restaurant.category ?? "").toLowerCase();
  const proteinLevel = restaurant.protein_level ?? null;
  const calorieLevel = restaurant.calorie_level ?? null;

  // base by category
  let kcal = 500;
  let protein = 25;
  let carbs = 50;
  let fat = 16;

  if (category.includes("poke")) {
    kcal = 540;
    protein = 32;
    carbs = 58;
    fat = 14;
  } else if (category.includes("salad")) {
    kcal = 410;
    protein = 22;
    carbs = 32;
    fat = 18;
  } else if (category.includes("vegan")) {
    kcal = 520;
    protein = 20;
    carbs = 62;
    fat = 16;
  } else if (category.includes("protein")) {
    kcal = 620;
    protein = 45;
    carbs = 48;
    fat = 18;
  } else if (category.includes("brunch")) {
    kcal = 680;
    protein = 28;
    carbs = 65;
    fat = 26;
  } else if (category.includes("burger")) {
    kcal = 720;
    protein = 38;
    carbs = 58;
    fat = 28;
  } else if (category.includes("juice")) {
    kcal = 280;
    protein = 6;
    carbs = 52;
    fat = 4;
  } else if (category.includes("matcha")) {
    kcal = 220;
    protein = 5;
    carbs = 28;
    fat = 8;
  } else if (category.includes("organic")) {
    kcal = 540;
    protein = 24;
    carbs = 56;
    fat = 18;
  } else if (category.includes("bowl")) {
    kcal = 560;
    protein = 28;
    carbs = 60;
    fat = 16;
  }

  // adjust by protein_level
  if (proteinLevel === "high") protein = Math.round(protein * 1.25);
  if (proteinLevel === "low") protein = Math.round(protein * 0.75);

  // adjust by calorie_level
  if (calorieLevel === "high") {
    kcal = Math.round(kcal * 1.15);
    fat = Math.round(fat * 1.2);
  }
  if (calorieLevel === "low") {
    kcal = Math.round(kcal * 0.82);
    fat = Math.round(fat * 0.7);
  }

  return {
    kcal: `~${Math.round(kcal / 10) * 10}`,
    protein: `${protein}g`,
    carbs: `${carbs}g`,
    fat: `${fat}g`,
    confidence: "estimated",
  };
}
