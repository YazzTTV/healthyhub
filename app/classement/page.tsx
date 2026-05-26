import Link from "next/link";
import { fetchTopRestaurantsByScore } from "@/lib/fetch-restaurant-list";
import { supabase } from "@/lib/supabase";
import { getScoreGlobalDisplay } from "@/lib/restaurant-card-display";
import { displayHealthyScore } from "@/lib/healthy-score";
import RestaurantImage from "@/components/RestaurantImage";

export const revalidate = 600;

export default async function ClassementPage() {
  const { data: rows, error } = await fetchTopRestaurantsByScore(supabase, 10);

  return (
    <section className="space-y-8 py-2 md:py-6">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
          Classement
        </span>
        <h1 className="text-[34px] font-semibold leading-[1.08] tracking-tighter-display text-ink md:text-[42px]">
          Top 10 · score global
        </h1>
        <p className="max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Les spots les mieux notés selon le score global HealthyHub (ou le
          score affiché si le score global n’est pas encore en base).
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </p>
      ) : null}

      <ol className="space-y-4">
        {rows.map((r, i) => {
          const sg = getScoreGlobalDisplay(r);
          const fallback = displayHealthyScore(r);
          const scoreLabel =
            sg != null ? sg.toFixed(1) : fallback.toFixed(1);
          const scoreKind = sg != null ? "Score global" : "Healthy";

          return (
            <li key={r.id}>
              <Link
                href={`/restaurants/${r.id}`}
                className="flex gap-4 rounded-[24px] bg-white p-4 shadow-soft ring-1 ring-ink/[0.06] transition hover:-translate-y-0.5 hover:ring-brand/25 sm:gap-5 sm:p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-light text-[18px] font-bold text-brand-deep">
                  {i + 1}
                </span>
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-brand-light sm:h-24 sm:w-24">
                  <RestaurantImage
                    restaurant={r}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
                    {scoreKind}
                  </p>
                  <p className="truncate text-[18px] font-semibold tracking-tight text-ink">
                    {r.name}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-ink-mute">
                    {[r.category, r.arrondissement ?? r.city]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end justify-center text-right">
                  <span className="text-[28px] font-semibold tabular-nums tracking-tight text-brand-dark sm:text-[32px]">
                    {scoreLabel}
                  </span>
                  <span className="text-[11px] font-medium text-ink-mute">/ 10</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="text-center text-[13px] text-ink-mute">
        <Link href="/discover" className="font-semibold text-brand-dark underline-offset-2 hover:underline">
          Ouvrir la carte
        </Link>
      </p>
    </section>
  );
}
