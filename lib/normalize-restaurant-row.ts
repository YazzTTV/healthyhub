import type { RestaurantListItem } from "@/lib/types";

type ScoreEmbed = { score_global?: number | null };

/** Aplatit `restaurant_scores` PostgREST et expose `score_global` au niveau racine. */
export function normalizeRestaurantRow(row: unknown): RestaurantListItem {
  const r = row as Record<string, unknown> & {
    restaurant_scores?: ScoreEmbed | ScoreEmbed[] | null;
    score_global?: number | null;
  };

  let score_global = r.score_global;
  const embed = r.restaurant_scores;
  if (score_global == null && embed != null) {
    if (Array.isArray(embed) && embed[0]) {
      score_global = embed[0].score_global ?? null;
    } else if (!Array.isArray(embed) && typeof embed === "object") {
      score_global = (embed as ScoreEmbed).score_global ?? null;
    }
  }

  const { restaurant_scores: _rs, signature_dish: rawDish, ...rest } = r;
  const signature_dish_name =
    (typeof rest.signature_dish_name === "string"
      ? rest.signature_dish_name
      : null) ??
    (typeof rawDish === "string" ? rawDish : null);

  return {
    ...(rest as RestaurantListItem),
    signature_dish_name: signature_dish_name?.trim() || null,
    score_global: score_global != null ? Number(score_global) : null,
  };
}
