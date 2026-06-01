import { displayHealthyScore } from "@/lib/healthy-score";
import {
  effectiveCalorieBand,
  effectiveCleanBand,
  effectiveProteinBand,
} from "@/lib/restaurant-helpers";
import type { RestaurantListItem } from "@/lib/types";

type NutritionLevel = "low" | "medium" | "high";

export type IntentMode =
  | "FOCUS_PRODUCTIVITY"
  | "MUSCLE_RECOVERY"
  | "LEAN_LIGHT"
  | "CLEAN_RESET"
  | "PLEASURE_WITHOUT_CRACKING";

type IntentDefinition = {
  id: IntentMode;
  label: string;
  icon: string;
  description: string;
};

type NutritionProfile = {
  proteinLevel: NutritionLevel;
  calorieLevel: NutritionLevel;
  cleanLevel: NutritionLevel;
};

type NormalizedNutritionProfile = NutritionProfile & {
  intentCompatibility: Record<IntentMode, number>;
};

const CATEGORY_HINTS: Record<string, NutritionProfile> = {
  salad: { proteinLevel: "medium", calorieLevel: "low", cleanLevel: "high" },
  vegan: { proteinLevel: "medium", calorieLevel: "low", cleanLevel: "high" },
  poke: { proteinLevel: "high", calorieLevel: "medium", cleanLevel: "high" },
  protein: { proteinLevel: "high", calorieLevel: "medium", cleanLevel: "medium" },
  bowls: { proteinLevel: "medium", calorieLevel: "medium", cleanLevel: "high" },
  bowl: { proteinLevel: "medium", calorieLevel: "medium", cleanLevel: "high" },
  brunch: { proteinLevel: "medium", calorieLevel: "high", cleanLevel: "medium" },
  burger: { proteinLevel: "high", calorieLevel: "high", cleanLevel: "low" },
  organic: { proteinLevel: "medium", calorieLevel: "low", cleanLevel: "high" },
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  salad: ["salad", "salade"],
  vegan: ["vegan", "vegetar", "plant", "veggie"],
  poke: ["poke"],
  protein: ["protein", "protei", "grill", "chicken", "poulet"],
  bowls: ["bowl"],
  brunch: ["brunch", "toast", "egg", "oeuf"],
  burger: ["burger"],
  organic: ["bio", "organic", "clean"],
};

const LEVEL_VALUE: Record<NutritionLevel, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const INTENT_MODES: IntentDefinition[] = [
  {
    id: "FOCUS_PRODUCTIVITY",
    label: "Focus & Productivite",
    icon: "⚡",
    description: "Energie stable, repas leger, pas de coup de barre.",
  },
  {
    id: "MUSCLE_RECOVERY",
    label: "Muscle & Recovery",
    icon: "💪",
    description: "Proteines, satiete, recuperation.",
  },
  {
    id: "LEAN_LIGHT",
    label: "Lean & Light",
    icon: "🥗",
    description: "Plus leger, plus controle.",
  },
  {
    id: "CLEAN_RESET",
    label: "Clean Reset",
    icon: "🌿",
    description: "Frais, equilibre, peu transforme.",
  },
  {
    id: "PLEASURE_WITHOUT_CRACKING",
    label: "Plaisir sans craquer",
    icon: "😌",
    description: "Gourmand mais aligne.",
  },
];

function includesKeyword(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getCategoryProfile(restaurant: RestaurantListItem): NutritionProfile {
  const blob = `${restaurant.category ?? ""} ${restaurant.cuisine ?? ""} ${restaurant.name ?? ""}`.toLowerCase();
  const matches = Object.entries(CATEGORY_KEYWORDS).filter(([, keywords]) =>
    includesKeyword(blob, keywords)
  );

  if (matches.length === 0) {
    return { proteinLevel: "medium", calorieLevel: "medium", cleanLevel: "medium" };
  }

  const totals = matches.reduce(
    (acc, [key]) => {
      const hint = CATEGORY_HINTS[key];
      acc.protein += LEVEL_VALUE[hint.proteinLevel];
      acc.calorie += LEVEL_VALUE[hint.calorieLevel];
      acc.clean += LEVEL_VALUE[hint.cleanLevel];
      acc.count += 1;
      return acc;
    },
    { protein: 0, calorie: 0, clean: 0, count: 0 }
  );

  const average = (value: number) => value / Math.max(1, totals.count);
  const toLevel = (value: number): NutritionLevel =>
    value >= 2.5 ? "high" : value >= 1.7 ? "medium" : "low";

  return {
    proteinLevel: toLevel(average(totals.protein)),
    calorieLevel: toLevel(average(totals.calorie)),
    cleanLevel: toLevel(average(totals.clean)),
  };
}

export function normalizeRestaurantNutritionProfile(
  restaurant: RestaurantListItem
): NormalizedNutritionProfile {
  const profile = resolveNutritionProfile(restaurant);
  const profileRestaurant: RestaurantListItem = {
    ...restaurant,
    protein_level: profile.proteinLevel,
    calorie_level: profile.calorieLevel,
    clean_level: profile.cleanLevel,
  };

  return {
    ...profile,
    intentCompatibility: {
      FOCUS_PRODUCTIVITY: getRestaurantIntentScore(
        profileRestaurant,
        "FOCUS_PRODUCTIVITY"
      ),
      MUSCLE_RECOVERY: getRestaurantIntentScore(profileRestaurant, "MUSCLE_RECOVERY"),
      LEAN_LIGHT: getRestaurantIntentScore(profileRestaurant, "LEAN_LIGHT"),
      CLEAN_RESET: getRestaurantIntentScore(profileRestaurant, "CLEAN_RESET"),
      PLEASURE_WITHOUT_CRACKING: getRestaurantIntentScore(
        profileRestaurant,
        "PLEASURE_WITHOUT_CRACKING"
      ),
    },
  };
}

function resolveNutritionProfile(restaurant: RestaurantListItem): NutritionProfile {
  const inferred = getCategoryProfile(restaurant);
  return {
    proteinLevel: effectiveProteinBand(restaurant) ?? inferred.proteinLevel,
    calorieLevel: effectiveCalorieBand(restaurant) ?? inferred.calorieLevel,
    cleanLevel: effectiveCleanBand(restaurant) ?? inferred.cleanLevel,
  };
}

function scoreFromHealthy(restaurant: RestaurantListItem) {
  return displayHealthyScore(restaurant) * 12;
}

function hasAnyCategory(restaurant: RestaurantListItem, keywords: string[]) {
  const blob = `${restaurant.category ?? ""} ${restaurant.cuisine ?? ""} ${restaurant.name ?? ""}`.toLowerCase();
  return includesKeyword(blob, keywords);
}

export function getRestaurantIntentScore(
  restaurant: RestaurantListItem,
  intent: IntentMode
) {
  const nutrition = resolveNutritionProfile(restaurant);
  const healthy = displayHealthyScore(restaurant);
  const scoreBase = scoreFromHealthy(restaurant);

  if (intent === "FOCUS_PRODUCTIVITY") {
    let score = scoreBase;
    if (restaurant.focus_productivity_fit === true) score += 24;
    if (restaurant.breakfast_fit === true) score += 8;
    if (nutrition.cleanLevel === "high") score += 20;
    if (nutrition.calorieLevel !== "high") score += 18;
    if (hasAnyCategory(restaurant, ["salad", "salade", "poke", "vegan", "organic", "bowl"])) score += 14;
    if (hasAnyCategory(restaurant, ["burger", "fried", "frit", "greasy"])) score -= 12;
    return score;
  }

  if (intent === "MUSCLE_RECOVERY") {
    let score = scoreBase;
    if (restaurant.muscle_recovery_fit === true) score += 26;
    if (nutrition.proteinLevel === "high") score += 24;
    if (nutrition.calorieLevel !== "low") score += 8;
    if (hasAnyCategory(restaurant, ["protein", "poke", "bowl", "grill", "poulet"])) score += 14;
    if (hasAnyCategory(restaurant, ["burger"]) && healthy >= 3) score += 8;
    return score;
  }

  if (intent === "LEAN_LIGHT") {
    let score = scoreBase;
    if (restaurant.lunch_light_fit === true) score += 22;
    if (nutrition.calorieLevel !== "high") score += 20;
    if (nutrition.cleanLevel === "high") score += 16;
    if (hasAnyCategory(restaurant, ["salad", "salade", "vegan", "poke", "organic"])) score += 12;
    return score;
  }

  if (intent === "CLEAN_RESET") {
    let score = scoreBase;
    if (restaurant.vegan_friendly === true) score += 10;
    if (restaurant.gluten_free_possible === true) score += 6;
    if (nutrition.cleanLevel === "high") score += 24;
    if (healthy >= 4) score += 16;
    if (hasAnyCategory(restaurant, ["vegan", "organic", "salad", "salade", "poke", "bowl"])) score += 12;
    return score;
  }

  let score = scoreBase;
  if (restaurant.pleasure_without_cracking_fit === true) score += 22;
  if (healthy >= 3) score += 16;
  if (hasAnyCategory(restaurant, ["brunch", "burger", "poke", "bowl", "protein"])) score += 14;
  if (nutrition.cleanLevel !== "low") score += 8;
  return score;
}

/** Texte d’intent — `why_this_score` en base uniquement (pas de phrase générée). */
export function getIntentReason(
  restaurant: RestaurantListItem,
  _intent: IntentMode
): string | null {
  const why = restaurant.why_this_score?.trim();
  if (!why) return null;
  return why.length > 160 ? `${why.slice(0, 157)}…` : why;
}

export function getIntentTag(intent: IntentMode) {
  return INTENT_MODES.find((mode) => mode.id === intent)?.label ?? "Objectif";
}
