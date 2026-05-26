import { displayHealthyScore } from "@/lib/healthy-score";
import {
  effectiveCalorieBand,
  effectiveCleanBand,
  effectiveProteinBand,
} from "@/lib/restaurant-helpers";
import type { RestaurantListItem } from "@/lib/types";

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Compteur « sauvegardes » déterministe — masqué si de vrais avis Google existent.
 */
export function getSavedCount(r: RestaurantListItem): number | null {
  const gRev = r.google_review_count;
  if (gRev != null && Number(gRev) > 0) return null;

  const score = displayHealthyScore(r);
  const key = r.slug || r.id || r.name;
  if (!key || score < 3.5) return null;

  const base = Math.round(80 + (score - 3.5) * 280);
  const noise = hash(`${key}-saves`) % 240;
  return base + noise;
}

/**
 * « Souvent choisi pour… » — priorité aux flags base, sinon heuristique catégorie.
 */
export function getOftenChosenFor(r: RestaurantListItem): string | null {
  if (r.muscle_recovery_fit === true) return "Muscle & Recovery";
  if (r.lunch_light_fit === true) return "Lean & Light";
  if (r.focus_productivity_fit === true) return "Focus & Productivité";
  if (r.pleasure_without_cracking_fit === true) return "Plaisir sans craquer";

  const cat = (r.category ?? "").toLowerCase();
  if (effectiveProteinBand(r) === "high" || cat.includes("protein")) {
    return "Muscle & Recovery";
  }
  if (effectiveCalorieBand(r) === "low" || cat.includes("salad") || cat.includes("juice")) {
    return "Lean & Light";
  }
  if (effectiveCleanBand(r) === "high" && displayHealthyScore(r) >= 4.5) {
    return "Clean Reset";
  }
  if (cat.includes("brunch") || cat.includes("burger")) {
    return "Plaisir sans craquer";
  }
  if (cat.includes("matcha") || cat.includes("juice")) {
    return "Focus & Productivité";
  }
  return null;
}
