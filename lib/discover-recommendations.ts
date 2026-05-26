import { calculateDistanceKm } from "@/lib/geo";
import { displayHealthyScore } from "@/lib/healthy-score";
import { getRestaurantIntentScore, type IntentMode } from "@/lib/intent";
import { getBestOrderLink } from "@/lib/order-links";
import type { RestaurantListItem } from "@/lib/types";

/** Objectifs carte « Mon objectif » → mode intent */
export type DiscoverGoal =
  | "Perte de poids"
  | "Prise de muscle"
  | "Manger clean"
  | null;

export function goalToIntent(goal: DiscoverGoal): IntentMode {
  if (goal === "Perte de poids") return "LEAN_LIGHT";
  if (goal === "Prise de muscle") return "MUSCLE_RECOVERY";
  if (goal === "Manger clean") return "CLEAN_RESET";
  return "CLEAN_RESET";
}

/**
 * Score composite : intention + score healthy affiché + bonus proximité.
 */
export function compositeRankScore(
  r: RestaurantListItem,
  intent: IntentMode,
  userLocation: [number, number] | null
): number {
  const intentScore = getRestaurantIntentScore(r, intent);
  const healthy = displayHealthyScore(r);
  let distBonus = 0;
  if (
    userLocation &&
    r.latitude != null &&
    r.longitude != null
  ) {
    const km = calculateDistanceKm(userLocation, [
      Number(r.latitude),
      Number(r.longitude),
    ]);
    distBonus = Math.max(0, 38 - km * 7);
  }
  return intentScore + healthy * 8 + distBonus;
}

export function rankRestaurantsForIntent(
  restaurants: RestaurantListItem[],
  intent: IntentMode,
  userLocation: [number, number] | null
): RestaurantListItem[] {
  if (restaurants.length === 0) return [];
  const scored = restaurants.map((r) => ({
    r,
    score: compositeRankScore(r, intent, userLocation),
  }));
  return scored
    .sort((a, b) => b.score - a.score)
    .map(({ r }) => r);
}

export function getBestChoice(
  restaurants: RestaurantListItem[],
  intent: IntentMode,
  userLocation: [number, number] | null
): RestaurantListItem | null {
  const ranked = rankRestaurantsForIntent(restaurants, intent, userLocation);
  return ranked[0] ?? null;
}

export function getPrimaryActionUrl(
  restaurant: Parameters<typeof getBestOrderLink>[0]
): string | null {
  return getBestOrderLink(restaurant)?.url ?? null;
}

export type WeekSpotlight = {
  id: string;
  headline: string;
  title: string;
  subtitle: string;
  restaurantId: string;
  /** Champs dénormalisés pour analytics (évite un lookup côté UI). */
  restaurantSnapshot: Pick<
    RestaurantListItem,
    "id" | "name" | "slug" | "category" | "arrondissement" | "healthy_score" | "city"
  >;
};

/** Signaux « dynamiques » déterministes — formulations prudentes si données partielles. */
export function buildWeekSpotlights(
  restaurants: RestaurantListItem[]
): WeekSpotlight[] {
  if (restaurants.length === 0) return [];

  const withDates = restaurants.filter((r) => r.created_at);
  let newest: RestaurantListItem;
  if (withDates.length > 0) {
    newest = [...withDates].sort(
      (a, b) =>
        new Date(String(b.created_at)).getTime() -
        new Date(String(a.created_at)).getTime()
    )[0];
  } else {
    newest = [...restaurants].sort((a, b) => a.id.localeCompare(b.id))[
      restaurants.length - 1
    ];
  }

  const editorial = restaurants.filter((r) => r.verified_by_healthyhub === true);
  const verifiedPool =
    editorial.length > 0
      ? editorial
      : restaurants.filter((r) => displayHealthyScore(r) >= 4.5);
  const verifiedPick =
    verifiedPool.length > 0
      ? rankRestaurantsForIntent(verifiedPool, "CLEAN_RESET", null)[0]
      : rankRestaurantsForIntent(restaurants, "CLEAN_RESET", null)[0];

  const topClean =
    rankRestaurantsForIntent(restaurants, "CLEAN_RESET", null)[0] ?? newest;

  return [
    {
      id: "new",
      headline: "Nouveaux spots ajoutés",
      title: newest.name,
      subtitle:
        withDates.length > 0
          ? "Récemment ajoutés au catalogue HealthyHub."
          : "Sélection mise à jour régulièrement.",
      restaurantId: newest.id,
      restaurantSnapshot: {
        id: newest.id,
        name: newest.name,
        slug: newest.slug,
        category: newest.category,
        arrondissement: newest.arrondissement,
        healthy_score: newest.healthy_score,
        city: newest.city,
      },
    },
    {
      id: "verified",
      headline: "Spots récemment vérifiés",
      title: verifiedPick?.name ?? newest.name,
      subtitle:
        verifiedPool.length > 0
          ? "Repères avec score HealthyHub élevé (≥ 4,5)."
          : "Sélection mise à jour régulièrement.",
      restaurantId: verifiedPick?.id ?? newest.id,
      restaurantSnapshot: {
        id: (verifiedPick ?? newest).id,
        name: (verifiedPick ?? newest).name,
        slug: (verifiedPick ?? newest).slug,
        category: (verifiedPick ?? newest).category,
        arrondissement: (verifiedPick ?? newest).arrondissement,
        healthy_score: (verifiedPick ?? newest).healthy_score,
        city: (verifiedPick ?? newest).city,
      },
    },
    {
      id: "clean",
      headline: "Top choix clean du moment",
      title: topClean.name,
      subtitle: "Mis en avant selon l’objectif « clean » et le score.",
      restaurantId: topClean.id,
      restaurantSnapshot: {
        id: topClean.id,
        name: topClean.name,
        slug: topClean.slug,
        category: topClean.category,
        arrondissement: topClean.arrondissement,
        healthy_score: topClean.healthy_score,
        city: topClean.city,
      },
    },
  ];
}
