import type { IntentMode } from "@/lib/intent";
import type { RestaurantListItem } from "@/lib/types";

/** Champs minimaux pour afficher le plat phare. */
export type SignatureDishNameInput = Pick<
  RestaurantListItem,
  "signature_dish_name"
>;

export type RestaurantConceptInput = Pick<
  RestaurantListItem,
  "category" | "cuisine"
>;

export type SpotHighlightKind = "signature_dish" | "concept";

export type SpotHighlight = {
  kind: SpotHighlightKind;
  label: string;
};

/**
 * Nom du plat phare — base Supabase uniquement (colonne `signature_dish`).
 */
export function getSignatureDishName(
  restaurant: SignatureDishNameInput,
  _intent?: IntentMode
): string | null {
  const fromDb = restaurant.signature_dish_name?.trim();
  return fromDb || null;
}

/**
 * Description du plat phare — base Supabase uniquement.
 */
export function getSignatureDishDescription(
  restaurant: RestaurantListItem
): string | null {
  const fromDb = restaurant.signature_dish_description?.trim();
  return fromDb || null;
}

export type SignatureDishDisplay = {
  name: string;
  description: string | null;
};

export function getSignatureDishDisplay(
  restaurant: RestaurantListItem,
  intent?: IntentMode
): SignatureDishDisplay | null {
  const name = getSignatureDishName(restaurant, intent);
  if (!name) return null;
  return {
    name,
    description: getSignatureDishDescription(restaurant),
  };
}

/**
 * Label concept cuisine — affiché quand il n'y a pas de plat phare en base.
 * Dérivé de category/cuisine (factuel), jamais inventé type pool de plats.
 */
export function getRestaurantConceptLabel(
  restaurant: RestaurantConceptInput
): string | null {
  const cat = (restaurant.category ?? "").toLowerCase().trim();
  const cui = (restaurant.cuisine ?? "").toLowerCase().trim();
  const blob = `${cat} ${cui}`;

  if (blob.includes("poke")) return "Poke bowls personnalisables";
  if (blob.includes("salad") || blob.includes("salade")) return "Salades et bowls";
  if (
    blob.includes("vegan") ||
    blob.includes("végétal") ||
    blob.includes("vegetal") ||
    blob.includes("plant")
  ) {
    return "Cuisine végétale";
  }
  if (blob.includes("brunch")) return "Healthy brunch";
  if (blob.includes("protein") || blob.includes("protéin")) return "Assiettes protéinées";
  if (blob.includes("bowl") || blob.includes("buddha") || blob.includes("grain")) {
    return "Salades et bowls";
  }
  if (blob.includes("burger")) return "Burgers & options veggie";
  if (blob.includes("juice") || blob.includes("jus") || blob.includes("smoothie")) {
    return "Jus & smoothies";
  }
  if (blob.includes("matcha") || blob.includes("coffee") || blob.includes("café")) {
    return "Café & matcha";
  }
  if (blob.includes("organic") || blob.includes("bio")) return "Cuisine bio & locale";
  if (blob.includes("asian") || blob.includes("asiat")) return "Cuisine asiatique healthy";

  const rawCat = restaurant.category?.trim();
  if (rawCat && rawCat.length <= 48) return rawCat;

  const rawCui = restaurant.cuisine?.trim();
  if (rawCui && rawCui.length <= 48) return rawCui;

  return null;
}

/** @deprecated Alias — utiliser `getRestaurantConceptLabel`. */
export const getCategoryDishLabel = getRestaurantConceptLabel;

/** Plat réel en base, sinon concept cuisine (jamais de nom de plat inventé). */
export function getSpotHighlight(
  restaurant: SignatureDishNameInput & RestaurantConceptInput
): SpotHighlight | null {
  const dish = getSignatureDishName(restaurant);
  if (dish) return { kind: "signature_dish", label: dish };
  const concept = getRestaurantConceptLabel(restaurant);
  if (concept) return { kind: "concept", label: concept };
  return null;
}

/** Libellé court pour cartes (avec préfixe « Plat phare · » si plat réel). */
export function getSpotLineLabel(
  restaurant: SignatureDishNameInput & RestaurantConceptInput,
  options?: { prefixSignature?: boolean }
): string | null {
  const highlight = getSpotHighlight(restaurant);
  if (!highlight) return null;
  if (highlight.kind === "signature_dish") {
    return options?.prefixSignature === false
      ? highlight.label
      : `Plat phare · ${highlight.label}`;
  }
  return highlight.label;
}
