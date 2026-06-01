import Link from "next/link";
import { getHealthyScoreExplainer } from "@/lib/healthy-score";
import type { Restaurant, RestaurantListItem } from "@/lib/types";

type Props = { restaurant: Restaurant | RestaurantListItem };

export default function ScoreExplainer({ restaurant }: Props) {
  const parts = getHealthyScoreExplainer(restaurant);
  const { score, tierLine, contextLine } = parts;

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
        <p>{tierLine}</p>
        {contextLine ? <p>{contextLine}</p> : null}
        <p>
          On note chaque adresse sur 5 critères : fraîcheur &amp; sourcing,
          équilibre nutritionnel, transparence du menu, cohérence du
          positionnement, retours terrain.
        </p>
        {parts.isInferred ? (
          <p className="text-[11.5px] text-ink/45">
            Score estimé par HealthyHub sur le profil du lieu — mis à jour à chaque visite terrain.
          </p>
        ) : null}
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
