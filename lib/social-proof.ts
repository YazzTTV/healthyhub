import { displayHealthyScore } from "@/lib/healthy-score";
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
 * Stable pseudo-real "saved by N users this month" count.
 * Higher healthy_score → more saves. Stable per restaurant.
 * Returns null if confidence is too low (no score / no slug).
 */
export function getSavedCount(r: RestaurantListItem): number | null {
  const score = displayHealthyScore(r);
  const key = r.slug || r.id || r.name;
  if (!key || score < 3.5) return null;

  // Higher healthy_score = base higher. Add stable noise from hash.
  const base = Math.round(80 + (score - 3.5) * 280);
  const noise = hash(`${key}-saves`) % 240;
  const total = base + noise;
  return total;
}

/**
 * "Often chosen for X" — derives the dominant intent fit.
 */
export function getOftenChosenFor(r: RestaurantListItem): string | null {
  const cat = (r.category ?? "").toLowerCase();
  if (r.protein_level === "high" || cat.includes("protein")) {
    return "Muscle & Recovery";
  }
  if (r.calorie_level === "low" || cat.includes("salad") || cat.includes("juice")) {
    return "Lean & Light";
  }
  if (r.clean_level === "high" && displayHealthyScore(r) >= 4.5) {
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
