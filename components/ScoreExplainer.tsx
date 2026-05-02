import Link from "next/link";
import {
  getHealthyScoreExplainer,
  type HealthyScoreExplainerParts,
} from "@/lib/healthy-score";
import type { Restaurant, RestaurantListItem } from "@/lib/types";

function fallbackFromScoreOnly(score: number): Omit<
  HealthyScoreExplainerParts,
  "score"
> {
  if (score >= 4.65) {
    return {
      tierLabel: "Référence",
      tierLine:
        "Carte très alignée « healthy » : ingrédients frais, peu transformés.",
      contextLine:
        "Sans le détail du lieu, on s’appuie sur la valeur du score affiché.",
    };
  }
  if (score >= 4.25) {
    return {
      tierLabel: "Très solide",
      tierLine: "Bonne cohérence pour un repas équilibré au quotidien.",
      contextLine:
        "Sans le détail du lieu, on s’appuie sur la valeur du score affiché.",
    };
  }
  if (score >= 3.85) {
    return {
      tierLabel: "Bon choix",
      tierLine:
        "Option fiable selon ce que tu commandes (sauces, portions, toppings).",
      contextLine:
        "Sans le détail du lieu, on s’appuie sur la valeur du score affiché.",
    };
  }
  if (score >= 3.45) {
    return {
      tierLabel: "Correct",
      tierLine:
        "Encore dans une logique healthy, avec un peu plus de marge sur le confort.",
      contextLine:
        "Sans le détail du lieu, on s’appuie sur la valeur du score affiché.",
    };
  }
  return {
    tierLabel: "Comfort healthy",
    tierLine:
      "Profil plus gourmand ou plus dense — idéal occasionnel si tu restes attentif.",
    contextLine:
      "Sans le détail du lieu, on s’appuie sur la valeur du score affiché.",
  };
}

type Props =
  | { restaurant: Restaurant | RestaurantListItem; score?: never }
  | { score: number | null; restaurant?: never };

export default function ScoreExplainer(props: Props) {
  let parts: HealthyScoreExplainerParts | null = null;

  if ("restaurant" in props && props.restaurant) {
    parts = getHealthyScoreExplainer(props.restaurant);
  } else if ("score" in props && props.score != null) {
    const score = props.score;
    parts = { score, ...fallbackFromScoreOnly(score) };
  }

  if (!parts) return null;

  const { score, tierLabel, tierLine, contextLine } = parts;

  return (
    <details className="group rounded-[16px] bg-white p-4 ring-1 ring-ink/[0.06]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold tracking-tight text-ink">
        <span className="flex items-center gap-2">
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-brand px-2.5 text-[11.5px] font-semibold text-white">
            ● {score.toFixed(1)}
          </span>
          <span>Pourquoi ce score&nbsp;?</span>
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-brand-deep transition group-open:rotate-180">
          <svg
            viewBox="0 0 24 24"
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>

      <div className="mt-3 space-y-3 text-[13px] leading-relaxed text-ink-soft">
        <p>
          <span className="font-semibold text-brand-deep">{tierLabel} · </span>
          {tierLine}
        </p>
        <p>{contextLine}</p>
        <p>
          On note chaque adresse sur 5 critères : fraîcheur &amp; sourcing,
          équilibre nutritionnel, transparence du menu, cohérence du
          positionnement, retours terrain.
        </p>
        <Link
          href="/about"
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-dark hover:text-brand"
        >
          Lire notre méthodologie complète
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </details>
  );
}
