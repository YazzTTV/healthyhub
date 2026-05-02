import { displayHealthyScore } from "@/lib/healthy-score";
import type { RestaurantListItem } from "@/lib/types";
import { getRestaurantBrandProfile } from "@/lib/restaurant-branding";

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

const DISH_POOL_BY_INTENT: Record<IntentMode, string[]> = {
  FOCUS_PRODUCTIVITY: [
    "Poke saumon avocat, edamame & riz vinaigre",
    "Salade quinoa, poulet grille & legumes croquants",
    "Buddha bowl tofu, legumes rotis & sauce tahini",
  ],
  MUSCLE_RECOVERY: [
    "Bowl poulet grille, riz complet & legumes verts",
    "Poke thon, avocat & double proteine",
    "Assiette saumon, patate douce & brocoli",
  ],
  LEAN_LIGHT: [
    "Salade fraiche proteinee, avocat & sauce legere",
    "Bowl vegan legumes croquants & quinoa",
    "Poke light saumon, concombre & edamame",
  ],
  CLEAN_RESET: [
    "Bowl vegan superfoods, patate douce & pois chiches",
    "Salade detox quinoa, graines & legumes frais",
    "Poke clean avocat, edamame & sauce citron vert",
  ],
  PLEASURE_WITHOUT_CRACKING: [
    "Burger clean au poulet grille & patate douce",
    "Brunch healthy avocat toast & oeufs bio",
    "Bowl gourmand saumon, mangue & avocat",
  ],
};

const BRAND_DISH_POOL_BY_INTENT: Record<
  ReturnType<typeof getRestaurantBrandProfile>,
  Partial<Record<IntentMode, string[]>>
> = {
  poke_chain: {
    FOCUS_PRODUCTIVITY: [
      "Poke saumon avocat, edamame & riz vinaigre",
      "Poke thon sesame, concombre & wakame",
      "Poke tofu grille, quinoa & legumes croquants",
    ],
    MUSCLE_RECOVERY: [
      "Poke double proteine saumon-thon & riz complet",
      "Poke poulet grille, avocat & edamame",
      "Poke saumon, quinoa & mix graines",
    ],
    LEAN_LIGHT: [
      "Poke light saumon, concombre, chou & sauce citron",
      "Poke tofu, crudites & base salade",
      "Poke crevettes, mangue & legumes verts",
    ],
    CLEAN_RESET: [
      "Poke clean avocat, edamame & sauce yuzu",
      "Poke vegan quinoa, legumes crus & algues",
      "Poke saumon, chou kale & vinaigrette sesame light",
    ],
    PLEASURE_WITHOUT_CRACKING: [
      "Poke gourmand saumon, mangue & avocat",
      "Poke spicy thon, oignons frits legers & sesame",
      "Poke signature mix proteins & toppings crunchy",
    ],
  },
  salad_counter: {
    FOCUS_PRODUCTIVITY: [
      "Salade quinoa poulet, legumes croquants & graines",
      "Salade saumon fume, avocat & concombre",
      "Salade lentilles, feta, herbes & citron",
    ],
    MUSCLE_RECOVERY: [
      "Salade proteinee poulet grille, oeuf & quinoa",
      "Salade boeuf maigre, pois chiches & crudites",
      "Salade thon, haricots verts & pommes de terre vapeur",
    ],
    LEAN_LIGHT: [
      "Salade verte avocat, concombre & vinaigrette legere",
      "Salade crudites, tofu grille & citron",
      "Salade kale, edamame & graines de courge",
    ],
    CLEAN_RESET: [
      "Salade detox quinoa, chou kale & legumes frais",
      "Bowl super greens, avocat & graines",
      "Salade vegan complete, legumes du jour & tahini",
    ],
    PLEASURE_WITHOUT_CRACKING: [
      "Salade Caesar healthy poulet grille",
      "Salade composee saumon, avocat & parmesan leger",
      "Bowl gourmand quinoa, feta & legumes rotis",
    ],
  },
  juice_bar: {
    FOCUS_PRODUCTIVITY: [
      "Sandwich complet dinde-avocat + jus vert",
      "Acai bowl granola maison + cold press",
      "Wrap poulet grille + smoothie proteine",
    ],
    MUSCLE_RECOVERY: [
      "Protein shake banane-cacahuete + sandwich poulet",
      "Wrap dinde-avocat + shot gingembre",
      "Bowl granola grec + smoothie proteine",
    ],
    LEAN_LIGHT: [
      "Jus vert detox + salad jar legere",
      "Smoothie fruits rouges + chia pudding",
      "Wrap veggie light + citronnade maison",
    ],
    CLEAN_RESET: [
      "Cold press celery-concombre-citron + bowl fruits",
      "Smoothie green matcha + energy balls",
      "Jus detox curcuma + salade quinoa",
    ],
    PLEASURE_WITHOUT_CRACKING: [
      "Smoothie cacao-banane + toast avocat",
      "Acai bowl gourmand + shot ginger",
      "Sandwich signature + jus presse minute",
    ],
  },
  vegan_cafe: {
    CLEAN_RESET: [
      "Bowl vegan patate douce, pois chiches & tahini",
      "Assiette legumes rotis, quinoa & houmous",
      "Curry vegetal coco, lentilles & riz complet",
    ],
    LEAN_LIGHT: [
      "Salade kale, tofu grille & sauce citron",
      "Buddha bowl legumes verts & quinoa",
      "Soupe legumes maison + petite salade",
    ],
  },
  protein_kitchen: {
    MUSCLE_RECOVERY: [
      "Bowl poulet grille, riz complet & legumes verts",
      "Assiette saumon, patate douce & brocoli",
      "Bowl boeuf maigre, quinoa & legumes",
    ],
    FOCUS_PRODUCTIVITY: [
      "Bowl dinde, quinoa & legumes de saison",
      "Salade proteinee poulet-avocat",
      "Assiette saumon, riz complet & crudites",
    ],
  },
  clean_burger: {
    PLEASURE_WITHOUT_CRACKING: [
      "Burger clean poulet grille + patate douce",
      "Burger veggie proteine + salade maison",
      "Burger boeuf maigre + coleslaw leger",
    ],
    MUSCLE_RECOVERY: [
      "Burger proteine boeuf maigre + salade",
      "Burger poulet grille + bowl quinoa",
      "Double steak clean + legumes grilles",
    ],
  },
  brunch_cafe: {
    FOCUS_PRODUCTIVITY: [
      "Avocado toast, oeufs bio & salade",
      "Granola maison, yaourt grec & fruits rouges",
      "Omelette legumes + pain complet",
    ],
    PLEASURE_WITHOUT_CRACKING: [
      "Pancakes proteines, fruits rouges & yaourt",
      "French toast brioche complete & fruits",
      "Brunch signature oeufs, avocado & granola",
    ],
  },
  bakery_light: {},
  coffee_light: {},
  asian_bowl: {},
  mediterranean_healthy: {
    CLEAN_RESET: [
      "Assiette mediterraneenne legumes, houmous & quinoa",
      "Bowl falafel au four, taboule & crudites",
      "Salade grecque proteinee & herbes fraiches",
    ],
  },
  default_healthy: {},
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
    proteinLevel: restaurant.protein_level ?? inferred.proteinLevel,
    calorieLevel: restaurant.calorie_level ?? inferred.calorieLevel,
    cleanLevel: restaurant.clean_level ?? inferred.cleanLevel,
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
    if (nutrition.cleanLevel === "high") score += 20;
    if (nutrition.calorieLevel !== "high") score += 18;
    if (hasAnyCategory(restaurant, ["salad", "salade", "poke", "vegan", "organic", "bowl"])) score += 14;
    if (hasAnyCategory(restaurant, ["burger", "fried", "frit", "greasy"])) score -= 12;
    return score;
  }

  if (intent === "MUSCLE_RECOVERY") {
    let score = scoreBase;
    if (nutrition.proteinLevel === "high") score += 24;
    if (nutrition.calorieLevel !== "low") score += 8;
    if (hasAnyCategory(restaurant, ["protein", "poke", "bowl", "grill", "poulet"])) score += 14;
    if (hasAnyCategory(restaurant, ["burger"]) && healthy >= 3) score += 8;
    return score;
  }

  if (intent === "LEAN_LIGHT") {
    let score = scoreBase;
    if (nutrition.calorieLevel !== "high") score += 20;
    if (nutrition.cleanLevel === "high") score += 16;
    if (hasAnyCategory(restaurant, ["salad", "salade", "vegan", "poke", "organic"])) score += 12;
    return score;
  }

  if (intent === "CLEAN_RESET") {
    let score = scoreBase;
    if (nutrition.cleanLevel === "high") score += 24;
    if (healthy >= 4) score += 16;
    if (hasAnyCategory(restaurant, ["vegan", "organic", "salad", "salade", "poke", "bowl"])) score += 12;
    return score;
  }

  let score = scoreBase;
  if (healthy >= 3) score += 16;
  if (hasAnyCategory(restaurant, ["brunch", "burger", "poke", "bowl", "protein"])) score += 14;
  if (nutrition.cleanLevel !== "low") score += 8;
  return score;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getRecommendedDishForIntent(
  restaurant: RestaurantListItem,
  intent: IntentMode
) {
  const profile = getRestaurantBrandProfile(restaurant);
  const brandPool = BRAND_DISH_POOL_BY_INTENT[profile]?.[intent];
  const pool = brandPool && brandPool.length > 0 ? brandPool : DISH_POOL_BY_INTENT[intent];
  const key = restaurant.slug ?? restaurant.id ?? restaurant.name;
  const index = hashString(`${intent}-${key}`) % pool.length;
  return pool[index];
}

export function getIntentReason(
  restaurant: RestaurantListItem,
  intent: IntentMode
) {
  const nutrition = resolveNutritionProfile(restaurant);
  if (intent === "FOCUS_PRODUCTIVITY") {
    if (nutrition.cleanLevel === "high" && nutrition.calorieLevel !== "high") {
      return "Leger, clean et ideal pour rester concentre.";
    }
    return "Option equilibree pour garder une energie stable apres le repas.";
  }

  if (intent === "MUSCLE_RECOVERY") {
    if (nutrition.proteinLevel === "high") {
      return "Riche en proteines, ideal apres une seance.";
    }
    return "Bon compromis proteines et satiete pour recuperer efficacement.";
  }

  if (intent === "LEAN_LIGHT") {
    return "Option plus legere pour garder le controle.";
  }

  if (intent === "CLEAN_RESET") {
    return "Repas frais, equilibre et peu transforme.";
  }

  return "Gourmand, mais plus clean qu'un vrai craquage.";
}

export function getIntentTag(intent: IntentMode) {
  return INTENT_MODES.find((mode) => mode.id === intent)?.label ?? "Objectif";
}
