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

  const { restaurant_scores: _rs, ...rest } = r;
  return {
    ...(rest as RestaurantListItem),
    score_global: score_global != null ? Number(score_global) : null,
  };
}
