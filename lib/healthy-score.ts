import type { RestaurantListItem } from "@/lib/types";

const MIN_SCORE = 3.2;
const MAX_SCORE = 5.0;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Une décimale affichée — pas d’arrondi « tout à .0 » via ce helper seul. */
function roundScoreDisplay(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Hash stable → [0, 1). Jamais de Math.random(). */
function hash01(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  const x = Math.abs(h) % 10_000;
  return x / 10_000;
}

type ScoreBand = { min: number; max: number; tag: string };

/** Marques connues → plage serrée (centre métier attendu). */
function bandFromKnownName(name: string): ScoreBand | null {
  const n = name.toLowerCase();
  if (/wild\s*&?\s*the\s*moon|wild\s+and\s+moon/.test(n)) {
    return { min: 4.65, max: 4.95, tag: "wild_moon" };
  }
  if (/cojean/.test(n)) return { min: 4.35, max: 4.58, tag: "cojean" };
  if (/pokawa/.test(n)) return { min: 4.05, max: 4.42, tag: "pokawa" };
  if (/protein\s*kitchen/.test(n)) return { min: 3.95, max: 4.38, tag: "protein_kitchen" };
  return null;
}

/**
 * Types de lieu → bornes demandées (végan / salade / poke / protein / brunch / burger…).
 */
export function getScoreBandMeta(
  restaurant: Pick<
    RestaurantListItem,
    "name" | "category" | "cuisine"
  >
): ScoreBand {
  const branded = bandFromKnownName(restaurant.name ?? "");
  if (branded) return branded;

  const cat = (restaurant.category ?? "").toLowerCase();
  const cuisine = (restaurant.cuisine ?? "").toLowerCase();
  const name = (restaurant.name ?? "").toLowerCase();
  const blob = `${cat} ${cuisine} ${name}`;

  if (/brunch/.test(blob)) {
    return { min: 3.6, max: 4.4, tag: "brunch" };
  }
  if (
    /burger|smash|comfort|street\s*food/.test(blob) &&
    !/vegan\s*burger|veggie\s*burger/.test(blob)
  ) {
    return { min: MIN_SCORE, max: 4.1, tag: "burger" };
  }
  if (
    /vegan|plant-based|organic|bio|cold\s*press|juicery|naturop/.test(blob) &&
    !/burger/.test(cat)
  ) {
    return { min: 4.4, max: MAX_SCORE, tag: "vegan_organic" };
  }
  if (/salad|salade|composé|bar\s*à\s*salade/.test(blob)) {
    return { min: 4.2, max: 4.9, tag: "salad" };
  }
  if (/poke|poké/.test(blob)) {
    return { min: 3.9, max: 4.7, tag: "poke" };
  }
  if (/bowl|buddha|grain/.test(blob) && /salad|light|quinoa|macro/.test(blob)) {
    return { min: 4.2, max: 4.9, tag: "light_bowl" };
  }
  if (/bowl|buddha|grain/.test(blob)) {
    return { min: 3.9, max: 4.7, tag: "bowl" };
  }
  if (/protein|fitness|sport|muscle|performance/.test(blob)) {
    return { min: 3.8, max: 4.6, tag: "protein" };
  }
  return { min: 3.75, max: 4.55, tag: "default" };
}

function nutritionNudge(
  restaurant: Pick<
    RestaurantListItem,
    "clean_level" | "calorie_level" | "protein_level"
  >
): number {
  let n = 0;
  if (restaurant.clean_level === "high") n += 0.07;
  if (restaurant.clean_level === "low") n -= 0.09;
  if (restaurant.calorie_level === "low") n += 0.05;
  if (restaurant.calorie_level === "high") n -= 0.06;
  if (restaurant.protein_level === "high") n += 0.04;
  if (restaurant.protein_level === "low") n -= 0.03;
  return n;
}

/**
 * Inférence déterministe uniquement à partir des attributs (pas la valeur DB).
 */
export function inferHealthyScoreFromAttributes(
  restaurant: RestaurantListItem
): number {
  const band = getScoreBandMeta(restaurant);
  const stableKey = `${restaurant.id}|${restaurant.slug ?? ""}|${restaurant.name ?? ""}`;

  const span = band.max - band.min;
  const positionInBand = hash01(`${stableKey}|pos`);
  const microJitter = (hash01(`${stableKey}|jit`) - 0.5) * 0.1;
  const raw =
    band.min + positionInBand * span + microJitter + nutritionNudge(restaurant);

  return roundScoreDisplay(clamp(raw, MIN_SCORE, MAX_SCORE));
}

/**
 * Cause racine des scores « tous pareils » :
 * - seed / import souvent à 5,0 (ou très proche) → on remplace par l’inférence ;
 * - ancienne échelle > 5,5 → conversion ;
 * - sinon on respecte un score DB déjà nuancé (3,2–5,0).
 */
export function getEffectiveHealthyScore(restaurant: RestaurantListItem): number {
  const s = restaurant.healthy_score;
  if (s != null && Number.isFinite(Number(s))) {
    const v = Number(s);
    if (v > 5.5) {
      return roundScoreDisplay(clamp(v / 2, MIN_SCORE, MAX_SCORE));
    }
    if (v >= MIN_SCORE && v <= MAX_SCORE) {
      if (Math.abs(v - 5) < 0.051) {
        return inferHealthyScoreFromAttributes(restaurant);
      }
      return roundScoreDisplay(clamp(v, MIN_SCORE, MAX_SCORE));
    }
  }
  return inferHealthyScoreFromAttributes(restaurant);
}

/** @deprecated Utiliser `getEffectiveHealthyScore` — conservé pour imports existants. */
export function estimateHealthyScore(restaurant: RestaurantListItem): number {
  return inferHealthyScoreFromAttributes(restaurant);
}

/** Alias historique — même valeur que `getEffectiveHealthyScore`. */
export function displayHealthyScore(restaurant: RestaurantListItem): number {
  return getEffectiveHealthyScore(restaurant);
}

export type HealthyScoreExplainerParts = {
  score: number;
  tierLabel: string;
  tierLine: string;
  contextLine: string;
};

/** Texte d’explication aligné sur le score effectif et le type de lieu (pas un texte unique). */
export function getHealthyScoreExplainer(
  restaurant: RestaurantListItem
): HealthyScoreExplainerParts {
  const score = getEffectiveHealthyScore(restaurant);
  const band = getScoreBandMeta(restaurant);

  let tierLabel: string;
  let tierLine: string;
  if (score >= 4.65) {
    tierLabel = "Référence";
    tierLine =
      "Carte très alignée « healthy » : ingrédients frais, peu transformés, lecture du menu simple.";
  } else if (score >= 4.25) {
    tierLabel = "Très solide";
    tierLine =
      "Exécution cohérente pour un repas équilibré au quotidien — peu de compromis sur la qualité.";
  } else if (score >= 3.85) {
    tierLabel = "Bon choix";
    tierLine =
      "Option fiable selon ce que tu composes : attention aux sauces et portions selon ton objectif.";
  } else if (score >= 3.45) {
    tierLabel = "Correct";
    tierLine =
      "Ça reste dans la sélection HealthyHub, mais plus orienté confort ou densité énergétique.";
  } else {
    tierLabel = "Comfort healthy";
    tierLine =
      "Profil plus gourmand ou plus dense — parfait occasionnel, moins pour un contrôle strict.";
  }

  const tagLines: Record<string, string> = {
    vegan_organic:
      "Typiquement riche en options végétales, bio ou peu transformées — d’où la note élevée si le lieu tient le cap.",
    salad:
      "Salades et bols légers : la note reflète la fraîcheur et la facilité à rester dans un bon équilibre.",
    poke:
      "Poke / bowls assemblés : beaucoup de contrôle possible, mais sauces et toppings peuvent faire monter l’énergie.",
    bowl:
      "Bowls complets : équilibre selon tes choix de base et de topping.",
    light_bowl:
      "Bols type « light » : souvent plus adaptés contrôle calories / digestion.",
    protein:
      "Repas orientés protéines / volume : utile pour la satiété, parfois plus calorique.",
    brunch:
      "Brunch : repas plus copieux — excellent le week-end, moins pour un jour « strict ».",
    burger:
      "Burger ou street healthy : version allégée du confort — la note reste volontairement plus basse.",
    default:
      "Profil général du lieu sur notre grille (fraîcheur, équilibre, transparence, cohérence).",
    wild_moon:
      "Marque reconnue pour le cru / plant-based — la note reflète ce positionnement.",
    cojean:
      "Chaîne salades / fraîcheur — bon contrôle des options légères en routine.",
    pokawa:
      "Chaîne poke : composition flexible, score selon qualité perçue et flex healthy.",
    protein_kitchen:
      "Focus performance et protéines — énergie plus dense selon les plats choisis.",
  };

  const contextLine =
    tagLines[band.tag] ?? tagLines.default;

  return { score, tierLabel, tierLine, contextLine };
}
