import type { RestaurantListItem } from "@/lib/types";

/** Raison courte « éditoriale » pour expliquer pourquoi le spot est mis en avant */
export function getBenefitTag(category: string | null) {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("protein")) return "Idéal post-entraînement";
  if (normalized.includes("vegan")) return "100% végétal";
  if (normalized.includes("salad") || normalized.includes("salade"))
    return "Pause déj légère";
  if (normalized.includes("poke")) return "Riche en protéines";
  if (normalized.includes("brunch")) return "Parfait le week-end";
  return "Spot équilibré";
}

/**
 * Modes de service déductibles des données (pas de champ sur place explicite en base).
 */
export function getServiceModeLabels(
  restaurant: Pick<RestaurantListItem, "uber_eats_url" | "deliveroo_url">
): string[] {
  if (restaurant.uber_eats_url || restaurant.deliveroo_url) {
    return ["Livraison & à emporter"];
  }
  return [];
}

/** Modes de service : sur place uniquement si indiqué ; sinon déduit des apps (emporter/livraison). */
export function getServiceAvailabilityChips(
  restaurant: Pick<RestaurantListItem, "uber_eats_url" | "deliveroo_url"> & {
    service_type?: string | null;
  }
): { label: string }[] {
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
  if (restaurant.uber_eats_url || restaurant.deliveroo_url) {
    chips.push({ label: "À emporter" });
    chips.push({ label: "Livraison" });
  }
  const seen = new Set<string>();
  return chips.filter((c) => {
    if (seen.has(c.label)) return false;
    seen.add(c.label);
    return true;
  });
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

