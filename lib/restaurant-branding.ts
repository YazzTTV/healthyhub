import type { RestaurantListItem } from "@/lib/types";

export type RestaurantBrandProfile =
  | "poke_chain"
  | "salad_counter"
  | "juice_bar"
  | "vegan_cafe"
  | "protein_kitchen"
  | "clean_burger"
  | "brunch_cafe"
  | "bakery_light"
  | "coffee_light"
  | "asian_bowl"
  | "mediterranean_healthy"
  | "default_healthy";

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function getSearchBlob(restaurant: Pick<RestaurantListItem, "name" | "category" | "cuisine">): string {
  return normalize(`${restaurant.name ?? ""} ${restaurant.category ?? ""} ${restaurant.cuisine ?? ""}`);
}

const BRAND_KEYWORDS: Record<RestaurantBrandProfile, readonly string[]> = {
  poke_chain: [
    "pokawa",
    "heiko",
    "island poke",
    "hawaiian poke",
    "hula poke",
    "coral poke",
    "holy poke",
    "hivi poke",
    "aloha poke",
    "lava poke",
    "poke house",
    "poke atelier",
    "poke",
  ],
  salad_counter: [
    "cojean",
    "green factory",
    "jour",
    "salad",
    "crisp",
    "le verger",
    "garden salad",
    "daily monop",
    "class croute",
    "nanashi",
    "mure",
    "field greens",
    "lean cuisine",
    "eat smart",
  ],
  juice_bar: [
    "joe the juice",
    "joe and the juice",
    "juicery",
    "juice",
    "cold press",
    "detox",
    "berry bar",
    "yumi",
    "mojo",
    "bobs juice",
    "juice lab",
    "holycow juice",
    "matcha",
    "acai",
  ],
  vegan_cafe: [
    "wild the moon",
    "wild moon",
    "potager",
    "vegan",
    "loving hut",
    "gentle gourmet",
    "joie vegetale",
    "earth cafe",
    "la vegan diner",
    "nobeef",
    "hank",
    "abattoir vegetal",
    "cloud cakes",
  ],
  protein_kitchen: [
    "protein",
    "hyperfit",
    "athletic plate",
    "fit lean",
    "body fuel",
    "iron bowl",
    "low carb",
    "macro lab",
    "macha cafe protein",
    "kitchen light",
  ],
  clean_burger: [
    "bioburger",
    "green sheep burger",
    "clean burger",
    "healthy burger",
    "naked burger",
    "east side burgers",
    "big fernand",
  ],
  brunch_cafe: [
    "holybelly",
    "kozy",
    "hardware societe",
    "lumiere brunch",
    "breakfast",
    "brunch",
    "carette",
    "cafe mareva",
    "maisie",
    "le pain quotidien",
  ],
  bakery_light: [
    "chambelland",
    "land monkeys",
    "helmut newcake",
    "noglu",
    "bob s bake",
    "aki boulangerie",
    "marlette",
    "laduree",
  ],
  coffee_light: [
    "cafe lomi",
    "fragments",
    "boot cafe",
    "honor cafe",
    "coutume",
    "loustic",
    "kb cafeshop",
    "belleville brulerie",
    "hexagone",
    "cabane cafe",
  ],
  asian_bowl: [
    "asian bowl",
    "buddha bowl",
    "bowl",
    "mantra bowl",
    "mosaique bowl",
    "karma bowl",
    "namnam",
    "bao bowl",
    "inca bowl",
    "mediterranean bowl",
  ],
  mediterranean_healthy: [
    "miznon",
    "hummus bar",
    "l as du fallafel",
    "fallafel",
    "daylesford",
    "maison plisson",
    "naturalia",
    "bio c bon",
    "marche",
  ],
  default_healthy: [],
};

const PROFILE_ORDER: RestaurantBrandProfile[] = [
  "poke_chain",
  "juice_bar",
  "protein_kitchen",
  "vegan_cafe",
  "salad_counter",
  "clean_burger",
  "brunch_cafe",
  "bakery_light",
  "coffee_light",
  "mediterranean_healthy",
  "asian_bowl",
];

export function getRestaurantBrandProfile(
  restaurant: Pick<RestaurantListItem, "name" | "category" | "cuisine">
): RestaurantBrandProfile {
  const blob = getSearchBlob(restaurant);
  for (const profile of PROFILE_ORDER) {
    if (hasAny(blob, BRAND_KEYWORDS[profile])) {
      return profile;
    }
  }
  return "default_healthy";
}

