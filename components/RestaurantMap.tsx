"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { trackEvent } from "@/lib/analytics";
import type { RestaurantListItem } from "@/lib/types";

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];
const FILTERS = [
  "Tous",
  "Poke",
  "Salade",
  "Vegan",
  "Protein",
  "Brunch",
  "Coups de cœur",
] as const;
const SORT_OPTIONS = ["Plus proches", "Mieux notés", "Score healthy"] as const;
const GOALS = ["Perte de poids", "Prise de muscle", "Manger clean"] as const;
const FAVORITES_KEY = "healthyhub:favorites";
type Goal = (typeof GOALS)[number];
type NutritionLevel = "low" | "medium" | "high";

type RestaurantProfile = {
  protein_level: NutritionLevel;
  calorie_level: NutritionLevel;
  clean_level: NutritionLevel;
  recommended_for_weight_loss: boolean;
  recommended_for_muscle_gain: boolean;
  recommended_for_clean_eating: boolean;
};

const CATEGORY_FALLBACK_IMAGES: Record<string, string[]> = {
  poke: [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467453678174-768ec283a940?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529692236671-f1dc59e7b8f9?w=1200&auto=format&fit=crop",
  ],
  salad: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467453678174-768ec283a940?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=1200&auto=format&fit=crop",
  ],
  vegan: [
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511690078903-71dc5a49f5e3?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514996937319-344454492b37?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514516345957-556ca7cac820?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=1200&auto=format&fit=crop",
  ],
  protein: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1543353071-087092ec393a?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514516345957-556ca7cac820?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529692236671-f1dc59e7b8f9?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&auto=format&fit=crop",
  ],
  brunch: [
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493770348161-369560ae357d?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464306076886-da185f6a9d05?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=1200&auto=format&fit=crop",
  ],
  organic: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511690078903-71dc5a49f5e3?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467453678174-768ec283a940?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1478144592103-25e218a04891?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514516345957-556ca7cac820?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
  ],
  bowl: [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1529692236671-f1dc59e7b8f9?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467453678174-768ec283a940?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
  ],
  default: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514516345957-556ca7cac820?w=1200&auto=format&fit=crop",
  ],
};

const SIGNATURE_DISH_POOL: Record<string, string[]> = {
  poke: [
    "Poke saumon avocat, edamame & riz vinaigré",
    "Poke thon sésame, mangue & concombre",
    "Bowl crevettes, avocat & sauce citron vert",
    "Poke tofu grillé, wakamé & riz complet",
    "Poke saumon teriyaki, chou rouge & radis",
    "Bowl tuna spicy, maïs croquant & avocat",
    "Poke poulet mariné, edamame & gingembre",
    "Bowl veggie, falafels & tahini citron",
    "Poke saumon miso, quinoa & légumes frais",
    "Bowl crevettes piment doux, avocat & sésame",
  ],
  salad: [
    "Salade quinoa, poulet grillé & légumes croquants",
    "Salade feta, avocat & graines torréfiées",
    "Caesar healthy au poulet, parmesan léger & romaine",
    "Salade lentilles, œuf parfait & herbes fraîches",
    "Salade saumon fumé, concombre & sauce yaourt",
    "Salade patate douce rôtie, kale & tahini",
    "Salade boulgour, pois chiches & légumes grillés",
    "Salade poulet citron, roquette & avocat",
    "Salade burrata légère, tomates anciennes & basilic",
    "Salade quinoa verte, concombre & menthe fraîche",
  ],
  vegan: [
    "Bowl vegan patate douce, pois chiches & tahini",
    "Curry végétal coco, lentilles & riz complet",
    "Buddha bowl tofu, légumes rôtis & sauce cacahuète",
    "Bowl quinoa, kale, avocat & houmous maison",
    "Tofu croustillant, brocoli & nouilles soba",
    "Chili vegan haricots rouges & riz brun",
    "Wrap vegan falafels, crudités & sauce tahini",
    "Bowl tempeh mariné, riz noir & légumes verts",
    "Dahl de lentilles corail & légumes de saison",
    "Bowl green goddess, quinoa & légumes croquants",
  ],
  protein: [
    "Bowl poulet grillé, riz complet & légumes verts",
    "Assiette saumon, patate douce & brocoli",
    "Wrap high-protein poulet, crudités & sauce légère",
    "Bowl dinde épicée, quinoa & avocat",
    "Steak de thon, riz brun & haricots verts",
    "Poulet teriyaki clean, riz jasmin & légumes sautés",
    "Bowl bœuf maigre, riz complet & légumes croquants",
    "Omelette protéinée, légumes grillés & salade fraîche",
    "Saumon grillé, quinoa citron & légumes vapeur",
    "Bowl poulet tandoori, légumes verts & riz brun",
  ],
  brunch: [
    "Avocado toast, œufs bio & granola maison",
    "Pancakes protéinés, fruits rouges & yaourt grec",
    "Toast saumon, fromage frais léger & citron",
    "Brioche complète, œufs brouillés & avocat",
    "Granola maison, skyr & fruits de saison",
    "Brunch veggie, houmous, œufs pochés & pain complet",
    "French toast healthy, fruits frais & yaourt",
    "Bagel saumon avocat, cream cheese léger & herbes",
    "Omelette herbes, salade croquante & pain complet",
    "Porridge protéiné, banane & beurre d'amande",
  ],
  organic: [
    "Assiette bio complète, légumes du marché & quinoa",
    "Bol superfoods, avocat, graines & tahini",
    "Poulet fermier grillé, légumes vapeur & céréales",
    "Salade bio de saison, pois chiches & huile d'olive",
    "Soupe detox maison & toast complet avocat",
    "Bowl green clean, quinoa, concombre & herbes",
    "Plat du marché, légumes rôtis & protéines maigres",
    "Wrap bio poulet, crudités & sauce yaourt",
    "Assiette vegan bio, tofu mariné & légumes verts",
    "Bowl équilibré, riz complet & légumes de saison",
  ],
  bowl: [
    "Bowl complet saumon, riz brun & légumes croquants",
    "Bowl poulet citron, quinoa & avocat",
    "Bowl végétal, falafels & légumes rôtis",
    "Bowl thon sésame, riz complet & concombre",
    "Bowl tofu curry, riz basmati & légumes",
    "Bowl crevettes grillées, quinoa & herbes fraîches",
    "Bowl dinde, patate douce & brocoli",
    "Bowl green goddess, légumes frais & tahini",
    "Bowl saumon teriyaki, riz brun & edamame",
    "Bowl poulet grillé, légumes vapeur & sauce légère",
  ],
  default: [
    "Plat healthy recommandé du chef",
    "Assiette équilibrée, légumes frais & protéines maigres",
    "Bowl signature maison, céréales complètes & légumes",
    "Recette de saison, cuisson légère & ingrédients frais",
    "Plat du moment, option clean & gourmande",
    "Assiette bien-être, protéines, fibres et bons lipides",
    "Sélection nutritionnelle du jour",
    "Menu signature healthy, riche en saveurs",
    "Recette équilibrée, faible en transformation",
    "Suggestion healthy premium de la maison",
  ],
};

function getCategoryIcon(category: string | null) {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("poke")) return "🥗";
  if (normalized.includes("salad") || normalized.includes("salade")) return "🥬";
  if (normalized.includes("vegan")) return "🌱";
  if (normalized.includes("protein")) return "💪";
  if (normalized.includes("brunch")) return "☕";
  return "🥗";
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeCategory(category: string | null) {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("poke")) return "poke";
  if (normalized.includes("salad") || normalized.includes("salade")) return "salad";
  if (normalized.includes("vegan")) return "vegan";
  if (normalized.includes("protein")) return "protein";
  if (normalized.includes("brunch")) return "brunch";
  if (normalized.includes("organic") || normalized.includes("bio")) return "organic";
  if (normalized.includes("bowl")) return "bowl";
  return "default";
}

function getStableIndex(input: string, arrayLength: number) {
  if (arrayLength <= 0) return 0;
  return hashString(input) % arrayLength;
}

function getRestaurantImage(restaurant: RestaurantListItem) {
  const hasValidImage =
    !!restaurant.image_url &&
    /^https?:\/\//.test(restaurant.image_url) &&
    !restaurant.image_url.includes("photo-1512621776951-a57141f2eefd");
  if (hasValidImage) return restaurant.image_url as string;

  const category = normalizeCategory(restaurant.category);
  const pool = CATEGORY_FALLBACK_IMAGES[category] ?? CATEGORY_FALLBACK_IMAGES.default;
  const stableKey = restaurant.slug || restaurant.id || restaurant.name;
  return pool[getStableIndex(`${stableKey}-image-${category}`, pool.length)];
}

function getSignatureDish(restaurant: RestaurantListItem) {
  const dbDish = (restaurant as RestaurantListItem & { signature_dish?: string | null })
    .signature_dish;
  if (dbDish && dbDish.trim().length > 0) return dbDish;

  const name = (restaurant.name ?? "").toLowerCase();
  const category = normalizeCategory(restaurant.category);
  if (name.includes("pokawa")) return "Poke saumon avocat, riz vinaigré & edamame";
  if (name.includes("cojean")) return "Salade quinoa, légumes frais & sauce légère";
  if (name.includes("wild") || name.includes("moon")) {
    return "Bowl vegan superfoods & lait végétal maison";
  }
  const pool = SIGNATURE_DISH_POOL[category] ?? SIGNATURE_DISH_POOL.default;
  const stableKey = restaurant.slug || restaurant.id || restaurant.name;
  return pool[getStableIndex(`${stableKey}-dish-${category}`, pool.length)];
}

function getPrimaryOrderUrl(restaurant: RestaurantListItem) {
  return restaurant.uber_eats_url ?? restaurant.deliveroo_url ?? null;
}

function getShortDescription(restaurant: RestaurantListItem) {
  const parts = [restaurant.cuisine, restaurant.city].filter(Boolean);
  if (parts.length > 0) {
    return `${parts.join(" · ")}. Frais et healthy.`;
  }
  return "Selection healthy, ideale pour une commande rapide.";
}

function getBenefitTag(category: string | null) {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("protein")) return "Best for post-workout";
  if (normalized.includes("vegan")) return "Vegan friendly";
  if (normalized.includes("salad") || normalized.includes("salade"))
    return "Light lunch";
  if (normalized.includes("poke")) return "High protein";
  if (normalized.includes("brunch")) return "Weekend fuel";
  return "Manger clean";
}

function inferRestaurantProfile(restaurant: RestaurantListItem): RestaurantProfile {
  const normalizedCategory = (restaurant.category ?? "").toLowerCase();
  const normalizedCuisine = (restaurant.cuisine ?? "").toLowerCase();
  const healthyScore = restaurant.healthy_score ?? 0;

  const hasProtein =
    normalizedCategory.includes("protein") ||
    normalizedCuisine.includes("protein") ||
    normalizedCuisine.includes("burger");
  const hasPoke = normalizedCategory.includes("poke") || normalizedCuisine.includes("poke");
  const hasSalad =
    normalizedCategory.includes("salad") ||
    normalizedCategory.includes("salade") ||
    normalizedCuisine.includes("salad");
  const hasVegan = normalizedCategory.includes("vegan") || normalizedCuisine.includes("vegan");
  const hasBrunch =
    normalizedCategory.includes("brunch") || normalizedCuisine.includes("brunch");

  const protein_level: NutritionLevel = hasProtein
    ? "high"
    : hasPoke || hasVegan
      ? "medium"
      : hasSalad
        ? "low"
        : hasBrunch
          ? "medium"
          : "medium";

  const calorie_level: NutritionLevel = hasSalad
    ? "low"
    : hasBrunch
      ? "high"
      : hasProtein || hasPoke || hasVegan
        ? "medium"
        : "medium";

  const clean_level: NutritionLevel =
    healthyScore >= 4.5 || hasSalad || hasVegan || hasPoke
      ? "high"
      : healthyScore >= 3.5
        ? "medium"
        : "low";

  return {
    protein_level: restaurant.protein_level ?? protein_level,
    calorie_level: restaurant.calorie_level ?? calorie_level,
    clean_level: restaurant.clean_level ?? clean_level,
    recommended_for_weight_loss:
      restaurant.recommended_for_weight_loss ??
      ((calorie_level === "low" || calorie_level === "medium") &&
        clean_level === "high" &&
        healthyScore >= 4),
    recommended_for_muscle_gain:
      restaurant.recommended_for_muscle_gain ??
      (protein_level === "high" && healthyScore >= 3),
    recommended_for_clean_eating:
      restaurant.recommended_for_clean_eating ??
      (clean_level === "high" && healthyScore >= 4),
  };
}

function rankRestaurantForGoal(
  restaurant: RestaurantListItem,
  goal: Goal,
  distanceKm: number | null
) {
  const profile = inferRestaurantProfile(restaurant);
  const healthyScore = restaurant.healthy_score ?? 0;
  let score = healthyScore * 10;

  if (distanceKm != null) {
    score += Math.max(0, 15 - distanceKm);
  }

  const category = (restaurant.category ?? "").toLowerCase();

  if (goal === "Perte de poids") {
    score += profile.calorie_level === "low" ? 30 : profile.calorie_level === "medium" ? 15 : -10;
    score += profile.clean_level === "high" ? 30 : profile.clean_level === "medium" ? 10 : -15;
    score += profile.recommended_for_weight_loss ? 25 : -20;
    score += healthyScore >= 4 ? 20 : -30;
    if (category.includes("salad") || category.includes("salade")) score += 15;
    if (category.includes("vegan")) score += 10;
    if (category.includes("poke")) score += 8;
  } else if (goal === "Prise de muscle") {
    score += profile.protein_level === "high" ? 35 : profile.protein_level === "medium" ? 10 : -20;
    score += profile.calorie_level === "high" || profile.calorie_level === "medium" ? 10 : -10;
    score += profile.recommended_for_muscle_gain ? 25 : -15;
    score += healthyScore >= 3 ? 15 : -20;
    if (category.includes("protein")) score += 18;
    if (category.includes("poke")) score += 10;
  } else {
    score += profile.clean_level === "high" ? 35 : profile.clean_level === "medium" ? 8 : -25;
    score += profile.recommended_for_clean_eating ? 25 : -15;
    score += healthyScore >= 4 ? 20 : -20;
    if (
      category.includes("poke") ||
      category.includes("salad") ||
      category.includes("salade") ||
      category.includes("vegan") ||
      category.includes("protein") ||
      category.includes("brunch")
    ) {
      score += 10;
    }
  }

  return score;
}

function getGoalFilteredRestaurants(
  goal: Goal,
  restaurants: RestaurantListItem[],
  getDistance: (restaurant: RestaurantListItem) => number | null
) {
  const scored = restaurants.map((restaurant) => ({
    restaurant,
    profile: inferRestaurantProfile(restaurant),
    score: rankRestaurantForGoal(restaurant, goal, getDistance(restaurant)),
  }));

  const strict = scored.filter(({ restaurant, profile }) => {
    const healthyScore = restaurant.healthy_score ?? 0;
    if (goal === "Perte de poids") {
      return (
        (profile.calorie_level === "low" || profile.calorie_level === "medium") &&
        profile.clean_level === "high" &&
        healthyScore >= 4 &&
        profile.recommended_for_weight_loss
      );
    }
    if (goal === "Prise de muscle") {
      return (
        profile.protein_level === "high" &&
        healthyScore >= 3 &&
        profile.recommended_for_muscle_gain
      );
    }
    return (
      profile.clean_level === "high" &&
      healthyScore >= 4 &&
      profile.recommended_for_clean_eating
    );
  });

  const pool =
    strict.length >= 4
      ? strict
      : [...scored]
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.min(20, Math.max(scored.length, 8)));

  return pool
    .sort((a, b) => b.score - a.score)
    .map(({ restaurant }) => restaurant);
}

function createRestaurantMarkerIcon(
  restaurant: RestaurantListItem,
  isSelected: boolean
) {
  const score = restaurant.healthy_score ?? 0;
  const accent = score >= 8 ? "#2f6d4e" : "#4f8a6b";
  const icon = getCategoryIcon(restaurant.category);
  return L.divIcon({
    className: "healthyhub-marker",
    html: `<div style="display:flex;align-items:center;justify-content:center;background:#fff;border:${isSelected ? "2px solid #2f6d4e" : "1px solid rgba(20,27,31,.12)"};box-shadow:${isSelected ? "0 12px 26px rgba(25,43,35,.30), 0 0 0 6px rgba(47,109,78,.12)" : "0 8px 18px rgba(0,0,0,.16)"};transform:${isSelected ? "scale(1.14)" : "scale(1)"};border-radius:999px;width:${isSelected ? "38px" : "32px"};height:${isSelected ? "38px" : "32px"};transition:all .18s;">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:999px;background:${accent}18;font-size:13px;line-height:1;">${icon}</span>
    </div>`,
    iconSize: isSelected ? [38, 38] : [32, 32],
    iconAnchor: isSelected ? [19, 19] : [16, 16],
  });
}

const userIcon = L.divIcon({
  className: "healthyhub-user-marker",
  html: `<div style="width:14px;height:14px;background:#2563eb;border:2px solid white;border-radius:999px;box-shadow:0 0 0 5px rgba(37,99,235,.22);"></div>`,
  iconAnchor: [7, 7],
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 0.6 });
  }, [center, map]);
  return null;
}

function calculateDistance(from: [number, number], to: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to[0] - from[0]);
  const dLon = toRad(to[1] - from[1]);
  const lat1 = toRad(from[0]);
  const lat2 = toRad(to[0]);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

export default function RestaurantMap({
  restaurants,
}: {
  restaurants: RestaurantListItem[];
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("Tous");
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>("Score healthy");
  const [activeGoal, setActiveGoal] = useState<(typeof GOALS)[number] | null>(null);
  const [isGoalPanelOpen, setIsGoalPanelOpen] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(PARIS_CENTER);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setFavorites(parsed);
    } catch {
      setFavorites([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void trackEvent({ event_name: "discover_page_loaded" });
  }, []);

  const updateFilter = (filter: (typeof FILTERS)[number]) => {
    setActiveFilter(filter);
    void trackEvent({
      event_name: "used_category_filter",
      metadata: { filter },
    });
  };

  const getRestaurantDistance = (restaurant: RestaurantListItem) => {
    if (!userPosition || restaurant.latitude == null || restaurant.longitude == null) {
      return null;
    }
    return calculateDistance(userPosition, [restaurant.latitude, restaurant.longitude]);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationMessage("La geolocalisation n'est pas disponible sur cet appareil.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserPosition(coords);
        setMapCenter(coords);
        setLocationMessage("Position détectée. Restaurants proches affichés.");
      },
      () => {
        setUserPosition(null);
        setMapCenter(PARIS_CENTER);
        setLocationMessage("Localisation refusée. On affiche Paris par défaut.");
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const toggleFavorite = (restaurantId: string) => {
    setFavorites((previous) => {
      const exists = previous.includes(restaurantId);
      const next = exists
        ? previous.filter((id) => id !== restaurantId)
        : [...previous, restaurantId];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      void trackEvent({
        event_name: "clicked_favorite",
        restaurant_id: restaurantId,
        metadata: { action: exists ? "removed" : "added" },
      });
      return next;
    });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = restaurants.filter((restaurant) => {
      const matchesFilter =
        activeFilter === "Tous" ||
        (activeFilter === "Coups de cœur" && favorites.includes(restaurant.id)) ||
        (restaurant.category ?? "")
          .toLowerCase()
          .includes(activeFilter.toLowerCase().replace("salade", "salad"));
      if (!matchesFilter) return false;

      if (!term) return true;
      return [restaurant.name, restaurant.category, restaurant.city]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });

    if (activeGoal) {
      result = getGoalFilteredRestaurants(activeGoal, result, getRestaurantDistance);
    }

    if (activeGoal && sortBy === "Score healthy") {
      return result;
    }

    const sorted = [...result].sort((a, b) => {
      if (sortBy === "Mieux notés") {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }

      if (sortBy === "Score healthy") {
        return (b.healthy_score ?? 0) - (a.healthy_score ?? 0);
      }

      if (!userPosition) {
        return (b.healthy_score ?? 0) - (a.healthy_score ?? 0);
      }

      const distA = getRestaurantDistance(a);
      const distB = getRestaurantDistance(b);
      if (distA == null) return 1;
      if (distB == null) return -1;
      return distA - distB;
    });

    return sorted;
  }, [activeFilter, activeGoal, favorites, restaurants, search, sortBy, userPosition]);

  const mappableRestaurants = useMemo(
    () => filtered.filter((restaurant) => restaurant.latitude != null && restaurant.longitude != null),
    [filtered]
  );

  const recommendationText = useMemo(() => {
    if (activeGoal === "Perte de poids") {
      return "Sélection légère, faible en calories, idéale pour garder le contrôle.";
    }
    if (activeGoal === "Prise de muscle") {
      return "Options riches en protéines pour soutenir tes objectifs.";
    }
    if (activeGoal === "Manger clean") {
      return "Les restaurants les plus équilibrés et clean autour de toi.";
    }
    return null;
  }, [activeGoal]);

  if (!hydrated) {
    return (
      <section className="relative h-[calc(100vh-5rem)] min-h-[680px] w-full overflow-hidden bg-cream">
        <div className="mx-auto max-w-6xl p-6">
          <div className="h-20 animate-pulse rounded-2xl bg-white/70" />
          <div className="mt-4 h-[65vh] animate-pulse rounded-3xl bg-white/60" />
        </div>
      </section>
    );
  }

  return (
    <section className="discover-ux relative h-[calc(100vh-5rem)] min-h-[680px] w-full overflow-hidden bg-cream sm:rounded-3xl sm:ring-1 sm:ring-ink/10">
      <div className="absolute inset-x-0 top-0 z-[1200] p-2 sm:p-3">
        <div className="rounded-2xl bg-white/95 p-2.5 shadow-md backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
            Paris
          </p>
          <h1 className="mt-0.5 text-lg font-bold text-ink sm:text-xl">
            Restaurants healthy à Paris
          </h1>
          <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {FILTERS.map((filter) => {
              const active = filter === activeFilter;
              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => updateFilter(filter)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-brand text-white"
                      : "bg-brand-light text-brand-dark hover:bg-brand/15"
                  }`}
                >
                  {filter}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleLocate}
              className="shrink-0 rounded-full border border-brand/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand-light"
            >
              Me localiser
            </button>
          </div>
          {isGoalPanelOpen ? (
            <div className="mt-2 rounded-xl border border-brand/10 bg-brand-light/60 p-2">
              <p className="text-xs font-semibold text-brand-dark">
                Choisis un resto aligné avec tes objectifs.
              </p>
              <p className="mt-0.5 text-[11px] text-ink/70">
                Moins de tentation. Plus de contrôle. Des options clean autour de
                toi.
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => {
                      setActiveGoal(goal);
                      setIsGoalPanelOpen(false);
                      void trackEvent({
                        event_name: "goal_filter_selected",
                        metadata: { goal },
                      });
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                      activeGoal === goal
                        ? "bg-brand text-white"
                        : "bg-white text-ink/75 ring-1 ring-ink/10 hover:text-brand"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {!isGoalPanelOpen && recommendationText ? (
            <p className="mt-1.5 rounded-xl bg-brand-light px-2.5 py-1.5 text-[11px] font-medium text-brand-dark ring-1 ring-brand/15">
              {recommendationText}
            </p>
          ) : null}
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-ink/65">Trier</span>
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])
              }
              className="rounded-full border border-ink/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          {activeGoal ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded-full bg-brand text-[11px] font-semibold text-white px-2.5 py-1">
                Objectif : {activeGoal}
              </span>
              <button
                type="button"
                onClick={() => setIsGoalPanelOpen(true)}
                className="rounded-full border border-ink/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink/75 hover:text-brand"
              >
                Changer d&apos;objectif
              </button>
            </div>
          ) : null}
          <div className="mt-1.5">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un resto ou une categorie..."
              className="w-full rounded-xl border border-ink/10 bg-white px-3 py-2 text-xs text-ink placeholder:text-ink/40 focus:border-brand focus:outline-none"
            />
          </div>
          {locationMessage ? (
            <p className="mt-1 text-[11px] text-ink/65">{locationMessage}</p>
          ) : null}
        </div>
      </div>

      <MapContainer
        center={PARIS_CENTER}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <RecenterMap center={mapCenter} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {userPosition ? (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>Vous etes ici</Popup>
          </Marker>
        ) : null}

        {mappableRestaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.latitude!, restaurant.longitude!]}
            icon={createRestaurantMarkerIcon(
              restaurant,
              activeRestaurantId === restaurant.id
            )}
            eventHandlers={{
              click: () => {
                setActiveRestaurantId(restaurant.id);
                setMapCenter([restaurant.latitude! + 0.0016, restaurant.longitude!]);
                void trackEvent({
                  event_name: "restaurant_marker_clicked",
                  restaurant_id: restaurant.id,
                  metadata: { source: "map_marker" },
                });
              },
            }}
          >
            <Popup className="healthyhub-popup" closeButton={false}>
              <div className="min-w-[220px] space-y-3">
                <div className="h-24 overflow-hidden rounded-2xl bg-brand-light">
                  {getRestaurantImage(restaurant) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getRestaurantImage(restaurant)}
                      alt={restaurant.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">
                      {getCategoryIcon(restaurant.category)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">{restaurant.name}</p>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(restaurant.id)}
                      className="rounded-full bg-brand-light px-2 py-1 text-xs"
                      aria-label="Ajouter aux favoris"
                    >
                      {favorites.includes(restaurant.id) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                      {restaurant.category ?? "Healthy food"}
                    </span>
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/70">
                      Score{" "}
                      {restaurant.healthy_score != null
                        ? restaurant.healthy_score.toFixed(1)
                        : "N/A"}
                    </span>
                    {getRestaurantDistance(restaurant) != null ? (
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/70">
                        {getRestaurantDistance(restaurant)!.toFixed(1)} km
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-ink/60">
                    {getShortDescription(restaurant)}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-brand-dark">
                    Plat phare: {getSignatureDish(restaurant)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {getPrimaryOrderUrl(restaurant) ? (
                    <a
                      href={getPrimaryOrderUrl(restaurant)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        void trackEvent({
                          event_name: "restaurant_order_clicked",
                          restaurant_id: restaurant.id,
                          metadata: {
                            source: "map_popup",
                            platform: restaurant.uber_eats_url ? "ubereats" : "deliveroo",
                          },
                        })
                      }
                      className="inline-flex rounded-full bg-brand px-3 py-1.5 text-xs font-semibold !text-white hover:bg-brand-dark"
                    >
                      Commander
                    </a>
                  ) : (
                    <span className="inline-flex cursor-not-allowed rounded-full border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/45">
                      Lien bientôt disponible
                    </span>
                  )}
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    onClick={() =>
                      void trackEvent({
                        event_name: "restaurant_card_clicked",
                        restaurant_id: restaurant.id,
                        metadata: { source: "map_popup" },
                      })
                    }
                    className="inline-flex rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold !text-brand-dark hover:border-brand/35"
                  >
                    Voir le restaurant
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <aside className="absolute bottom-4 left-4 top-[188px] z-[900] hidden w-[340px] rounded-3xl bg-white/95 p-3 shadow-2xl backdrop-blur lg:block">
        <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          Restaurants
        </div>
        <div className="h-full space-y-2 overflow-y-auto pb-10">
          {filtered.map((restaurant) => {
            const isFavorite = favorites.includes(restaurant.id);
            const distance =
              getRestaurantDistance(restaurant);
            return (
              <article
                key={`desktop-${restaurant.id}`}
                className={`rounded-2xl border bg-white p-3 transition ${
                  activeRestaurantId === restaurant.id
                    ? "border-brand/60 shadow-md"
                    : "border-ink/10"
                }`}
              >
                <div className="relative h-24 overflow-hidden rounded-xl bg-brand-light">
                  {getRestaurantImage(restaurant) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getRestaurantImage(restaurant)}
                      alt={restaurant.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl">🥗</div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleFavorite(restaurant.id)}
                    className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-sm shadow"
                  >
                    {isFavorite ? "❤️" : "🤍"}
                  </button>
                </div>
                <p className="mt-2 truncate text-sm font-semibold text-ink">{restaurant.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                    {restaurant.category ?? "Healthy"}
                  </span>
                  <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/70">
                    Score {restaurant.healthy_score ?? "N/A"}
                  </span>
                  {distance != null ? (
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/70">
                      {distance.toFixed(1)} km
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs font-semibold text-brand-dark">
                  Plat phare: {getSignatureDish(restaurant)}
                </p>
                <p className="mt-1 text-xs text-ink/55">
                  {getBenefitTag(restaurant.category)}
                </p>
                <div className="mt-2 flex gap-2">
                  {restaurant.uber_eats_url || restaurant.deliveroo_url ? (
                    <a
                      href={getPrimaryOrderUrl(restaurant) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        void trackEvent({
                          event_name: "restaurant_order_clicked",
                          restaurant_id: restaurant.id,
                          metadata: {
                            source: "desktop_panel",
                            platform: restaurant.uber_eats_url ? "ubereats" : "deliveroo",
                          },
                        })
                      }
                      className="inline-flex rounded-full bg-brand px-3 py-1.5 text-xs font-semibold !text-white"
                    >
                      Commander
                    </a>
                  ) : (
                    <span className="inline-flex cursor-not-allowed rounded-full border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/45">
                      Lien bientôt disponible
                    </span>
                  )}
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    onClick={() =>
                      void trackEvent({
                        event_name: "restaurant_card_clicked",
                        restaurant_id: restaurant.id,
                        metadata: { source: "desktop_panel" },
                      })
                    }
                    className="inline-flex rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold !text-brand-dark"
                  >
                    Voir
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </aside>

      <div className="absolute inset-x-0 bottom-0 z-[1000] p-4 sm:p-6">
        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-white/95 p-4 text-sm text-ink/70 shadow-xl backdrop-blur">
            Aucun restaurant ne correspond a ce filtre. Essaie une autre
            categorie.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1 lg:hidden">
            {filtered.map((restaurant) => {
              const isFavorite = favorites.includes(restaurant.id);
              const distance =
                getRestaurantDistance(restaurant);
              return (
                <article
                  key={restaurant.id}
                  className={`w-[270px] shrink-0 rounded-3xl bg-white/95 p-3 shadow-xl backdrop-blur transition ${
                    activeRestaurantId === restaurant.id ? "ring-2 ring-brand/60" : ""
                  }`}
                >
                  <div className="relative h-28 overflow-hidden rounded-2xl bg-brand-light">
                    {getRestaurantImage(restaurant) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getRestaurantImage(restaurant)}
                        alt={restaurant.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-3xl">🥗</div>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleFavorite(restaurant.id)}
                      className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-sm shadow"
                      aria-label="Ajouter aux favoris"
                    >
                      {isFavorite ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <h3 className="mt-3 truncate text-sm font-semibold text-ink">
                    {restaurant.name}
                  </h3>
                  <p className="mt-1 text-xs text-ink/70">
                    {restaurant.category ?? "Healthy"} - score{" "}
                    {restaurant.healthy_score != null
                      ? restaurant.healthy_score.toFixed(1)
                      : "N/A"}
                    {distance != null ? ` · ${distance.toFixed(1)} km` : ""}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-brand-dark">
                    Plat phare: {getSignatureDish(restaurant)}
                  </p>
                  <p className="mt-1 text-[11px] text-ink/55">
                    {getBenefitTag(restaurant.category)}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {restaurant.uber_eats_url || restaurant.deliveroo_url ? (
                      <a
                        href={getPrimaryOrderUrl(restaurant) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          void trackEvent({
                            event_name: "restaurant_order_clicked",
                            restaurant_id: restaurant.id,
                            metadata: {
                              source: "floating_card",
                              platform: restaurant.uber_eats_url ? "ubereats" : "deliveroo",
                            },
                          })
                        }
                        className="inline-flex rounded-full bg-brand px-3 py-1.5 text-xs font-semibold !text-white"
                      >
                        Commander
                      </a>
                    ) : (
                      <span className="inline-flex cursor-not-allowed rounded-full border border-ink/10 bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink/45">
                        Lien bientôt disponible
                      </span>
                    )}
                    <Link
                      href={`/restaurants/${restaurant.id}`}
                      onClick={() =>
                        void trackEvent({
                          event_name: "restaurant_card_clicked",
                          restaurant_id: restaurant.id,
                          metadata: { source: "floating_card" },
                        })
                      }
                      className="inline-flex rounded-full border border-ink/15 bg-white px-3 py-1.5 text-xs font-semibold !text-brand-dark hover:border-brand/30"
                    >
                      Voir
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
