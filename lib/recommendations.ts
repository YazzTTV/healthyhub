import { displayHealthyScore } from "@/lib/healthy-score";
import type { RestaurantListItem } from "@/lib/types";

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function dayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function isQuickService(r: RestaurantListItem): boolean {
  const cat = (r.category ?? "").toLowerCase();
  return (
    cat.includes("poke") ||
    cat.includes("salad") ||
    cat.includes("bowl") ||
    cat.includes("juice") ||
    cat.includes("matcha") ||
    cat.includes("pret a manger")
  );
}

/**
 * Pick of the day — deterministic per UTC day, weighted by healthy_score & rating.
 * Rotates daily so the homepage feels alive.
 */
export function getPickOfTheDay(
  restaurants: RestaurantListItem[]
): RestaurantListItem | null {
  if (restaurants.length === 0) return null;
  const eligible = restaurants
    .filter((r) => displayHealthyScore(r) >= 4.3 && r.image_url)
    .slice(0, 60);
  const pool = eligible.length > 0 ? eligible : restaurants.slice(0, 30);
  const seed = hashString(dayKey());
  return pool[seed % pool.length];
}

/**
 * Best for Lean & Light — low calorie + high clean.
 */
export function getBestForLean(
  restaurants: RestaurantListItem[]
): RestaurantListItem | null {
  const scored = restaurants
    .map((r) => {
      const cat = (r.category ?? "").toLowerCase();
      let score = displayHealthyScore(r) * 10;
      if (r.calorie_level === "low") score += 25;
      if (r.clean_level === "high") score += 18;
      if (cat.includes("salad")) score += 12;
      if (cat.includes("juice")) score += 8;
      if (cat.includes("vegan")) score += 6;
      if (cat.includes("brunch")) score -= 10;
      if (cat.includes("burger")) score -= 18;
      if (r.recommended_for_weight_loss === true) score += 12;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.r ?? null;
}

/**
 * Best post-workout / muscle — high protein.
 */
export function getBestForMuscle(
  restaurants: RestaurantListItem[]
): RestaurantListItem | null {
  const scored = restaurants
    .map((r) => {
      const cat = (r.category ?? "").toLowerCase();
      let score = displayHealthyScore(r) * 10;
      if (r.protein_level === "high") score += 28;
      if (r.protein_level === "medium") score += 8;
      if (cat.includes("protein")) score += 18;
      if (cat.includes("poke")) score += 10;
      if (cat.includes("burger")) score += 6;
      if (r.recommended_for_muscle_gain === true) score += 12;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0]?.r ?? null;
}

/**
 * Quick lunch — deli/fast healthy.
 */
export function getQuickPick(
  restaurants: RestaurantListItem[]
): RestaurantListItem | null {
  const scored = restaurants
    .filter((r) => isQuickService(r))
    .map((r) => ({ r, score: displayHealthyScore(r) * 10 }))
    .sort((a, b) => b.score - a.score);
  return scored[0]?.r ?? null;
}

export function getReasonChips(r: RestaurantListItem): string[] {
  const chips: string[] = [];
  if (r.calorie_level === "low") chips.push("Léger");
  if (r.calorie_level === "high") chips.push("Copieux");
  if (r.protein_level === "high") chips.push("Riche en protéines");
  if (r.clean_level === "high") chips.push("Clean");
  if (isQuickService(r)) chips.push("Rapide");
  return chips.slice(0, 3);
}

export function getReasonSentence(r: RestaurantListItem): string {
  const cat = (r.category ?? "").toLowerCase();
  const parts: string[] = [];
  if (r.calorie_level === "low") parts.push("léger");
  if (r.protein_level === "high") parts.push("riche en protéines");
  if (r.clean_level === "high") parts.push("ingrédients clean");
  if (parts.length === 0) {
    if (cat.includes("poke")) parts.push("frais et équilibré");
    else if (cat.includes("vegan")) parts.push("100% végétal");
    else if (cat.includes("brunch")) parts.push("parfait pour un brunch posé");
    else if (cat.includes("burger")) parts.push("burger qui fait du bien");
    else parts.push("équilibré et savoureux");
  }
  const phrase = parts.join(", ");
  if (cat.includes("protein") || r.protein_level === "high") {
    return `${capitalize(phrase)} — idéal après une séance de sport.`;
  }
  if (r.calorie_level === "low" || cat.includes("salad")) {
    return `${capitalize(phrase)} — parfait avant un aprèm de boulot.`;
  }
  if (cat.includes("brunch")) {
    return `${capitalize(phrase)} — pour un week-end qui démarre bien.`;
  }
  return `${capitalize(phrase)} — bon choix sans culpabilité.`;
}

function capitalize(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}
