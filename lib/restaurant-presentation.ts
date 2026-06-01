import { hasOrderPlatformLinks } from "@/lib/order-links";
import {
  effectiveCalorieBand,
  effectiveProteinBand,
} from "@/lib/restaurant-helpers";
import type { RestaurantListItem } from "@/lib/types";

function hasValidatedDeliveryLink(
  restaurant: Pick<
    RestaurantListItem,
    | "uber_eats_url"
    | "uber_eats_status"
    | "deliveroo_url"
    | "deliveroo_status"
  >
): boolean {
  return hasOrderPlatformLinks(restaurant);
}

/**
 * Tag éditorial « Idéal pour · » — hiérarchie de confiance :
 * 1. Flags DB explicites (muscle_recovery_fit, etc.)     → fiabilité maximale
 * 2. Colonnes nutritionnelles DB (protein_level, etc.)   → inférence fiable
 * 3. Catégorie (derniers recours, seulement cas clairs)  → inférence raisonnable
 * Jamais de libellé générique pour tous : mieux vaut null que "Spot équilibré".
 */
export function getBenefitTag(
  restaurant: Pick<
    RestaurantListItem,
    | "category"
    | "protein_level"
    | "calorie_level"
    | "calorie_density"
    | "muscle_recovery_fit"
    | "lunch_light_fit"
    | "focus_productivity_fit"
    | "pleasure_without_cracking_fit"
    | "vegan_friendly"
  >
): string | null {
  // Tier 1 — flags éditoriaux explicites
  if (restaurant.muscle_recovery_fit === true) return "Idéal post-entraînement";
  if (restaurant.lunch_light_fit === true) return "Pause déj légère";
  if (restaurant.focus_productivity_fit === true) return "Focus & énergie";
  if (restaurant.pleasure_without_cracking_fit === true) return "Plaisir sans craquer";

  // Tier 2 — colonnes nutritionnelles DB
  const protein = effectiveProteinBand(restaurant);
  const cal = effectiveCalorieBand(restaurant);
  if (protein === "high" && cal !== "high") return "Idéal post-entraînement";
  if (cal === "low") return "Option légère";

  // Tier 3 — catégorie (seulement cas non-ambigus)
  const cat = (restaurant.category ?? "").toLowerCase();
  if (restaurant.vegan_friendly === true || cat.includes("vegan")) return "100% végétal";
  if (cat.includes("poke")) return "Riche en protéines";
  if (cat.includes("salad") || cat.includes("salade")) return "Pause déj légère";
  if (cat.includes("brunch")) return "Parfait le week-end";

  return null;
}

/**
 * Modes de service : colonnes booléennes en priorité, sinon `service_type` + apps.
 */
export function getServiceModeLabels(
  restaurant: Pick<
    RestaurantListItem,
    | "uber_eats_url"
    | "uber_eats_status"
    | "deliveroo_url"
    | "deliveroo_status"
    | "takeaway_possible"
    | "dine_in_possible"
    | "delivery_possible"
  >
): string[] {
  const hasBool =
    restaurant.dine_in_possible != null ||
    restaurant.takeaway_possible != null ||
    restaurant.delivery_possible != null;

  if (hasBool) {
    const out: string[] = [];
    if (restaurant.dine_in_possible) out.push("Sur place");
    if (restaurant.takeaway_possible) out.push("À emporter");
    if (restaurant.delivery_possible) out.push("Livraison");
    if (out.length > 0) return out;
  }

  if (hasValidatedDeliveryLink(restaurant)) {
    return ["Livraison & à emporter"];
  }
  return [];
}

function dedupeChips(chips: { label: string }[]) {
  const seen = new Set<string>();
  return chips.filter((c) => {
    if (seen.has(c.label)) return false;
    seen.add(c.label);
    return true;
  });
}

export function getServiceAvailabilityChips(
  restaurant: Pick<
    RestaurantListItem,
    | "uber_eats_url"
    | "uber_eats_status"
    | "deliveroo_url"
    | "deliveroo_status"
    | "service_type"
    | "dine_in_possible"
    | "takeaway_possible"
    | "delivery_possible"
  >
): { label: string }[] {
  const hasBool =
    restaurant.dine_in_possible != null ||
    restaurant.takeaway_possible != null ||
    restaurant.delivery_possible != null;

  if (hasBool) {
    const chips: { label: string }[] = [];
    if (restaurant.dine_in_possible) chips.push({ label: "Sur place" });
    if (restaurant.takeaway_possible) chips.push({ label: "À emporter" });
    if (restaurant.delivery_possible) chips.push({ label: "Livraison" });
    if (
      chips.length === 0 &&
      hasValidatedDeliveryLink(restaurant)
    ) {
      chips.push({ label: "À emporter" }, { label: "Livraison" });
    }
    return dedupeChips(chips);
  }

  const chips: { label: string }[] = [];
  const raw = (restaurant.service_type ?? "").toLowerCase().trim();
  if (raw) {
    if (
      raw.includes("dine") ||
      raw.includes("sur_place") ||
      raw.includes("on_site") ||
      (raw.includes("place") && !raw.includes("marketplace"))
    ) {
      chips.push({ label: "Sur place" });
    }
    if (
      raw.includes("take") ||
      raw.includes("emporter") ||
      raw.includes("takeaway") ||
      raw.includes("à emporter")
    ) {
      chips.push({ label: "À emporter" });
    }
    if (
      raw.includes("deliver") ||
      raw.includes("livraison") ||
      raw.includes("delivery")
    ) {
      chips.push({ label: "Livraison" });
    }
  }
  if (hasValidatedDeliveryLink(restaurant)) {
    chips.push({ label: "À emporter" });
    chips.push({ label: "Livraison" });
  }
  return dedupeChips(chips);
}

/**
 * Sans parsing fiable des horaires → pas de « ouvert maintenant » en direct.
 * Quand opening_hours sera structuré côté app, brancher ici le calcul réel.
 */
export function getOpeningHoursShortLabel(restaurant: {
  opening_hours?: unknown | null;
}): string {
  if (restaurant.opening_hours == null || restaurant.opening_hours === "") {
    return "Horaires à confirmer";
  }
  return "Vérifier les horaires";
}
