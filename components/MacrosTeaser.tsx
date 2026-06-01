import {
  getCategoryCalorieRange,
  getMenuMacros,
  getNutritionOrientationChips,
} from "@/lib/restaurant-credibility";
import { getSignatureDishName } from "@/lib/signature-dish";
import type { Restaurant, RestaurantListItem } from "@/lib/types";

export default function MacrosTeaser({
  restaurant,
  dishName,
  variant = "default",
}: {
  restaurant: Restaurant | RestaurantListItem;
  dishName?: string;
  variant?: "default" | "compact";
}) {
  const exactMacros = getMenuMacros(restaurant);
  const resolvedDish = dishName?.trim() || getSignatureDishName(restaurant) || null;

  // ── Tier 1: exact menu macros (all 4 values in DB) ───────────────────────
  if (exactMacros) {
    const items = [
      { label: "kcal", value: exactMacros.kcal },
      { label: "protéines", value: exactMacros.protein },
      { label: "glucides", value: exactMacros.carbs },
      { label: "lipides", value: exactMacros.fat },
    ];

    if (variant === "compact") {
      return (
        <div className="rounded-xl bg-brand-soft/90 px-2.5 py-2 ring-1 ring-brand/12">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-deep">
              Macros du plat phare
            </p>
            <span
              className="text-[9px] font-medium text-ink-mute"
              title="Valeurs renseignées pour ce plat en base de données."
            >
              fiche lieu
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1">
            {items.map((it) => (
              <div
                key={it.label}
                className="rounded-lg bg-white px-1 py-1.5 text-center ring-1 ring-ink/[0.04]"
              >
                <p className="text-[12px] font-semibold tracking-tight text-ink">
                  {it.value}
                </p>
                <p className="text-[8px] uppercase tracking-[0.08em] text-ink-mute">
                  {it.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-[20px] bg-brand-soft p-4 ring-1 ring-brand/15 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Macros du plat phare
          </p>
          <span
            className="text-[10.5px] font-medium text-ink-mute"
            title="Valeurs renseignées pour ce plat en base de données."
          >
            fiche lieu
          </span>
        </div>
        {resolvedDish ? (
          <p className="mt-1 text-[12.5px] text-ink-soft">
            Sur le plat phare :{" "}
            <span className="font-medium">{resolvedDish}</span>
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {items.map((it) => (
            <div
              key={it.label}
              className="rounded-xl bg-white px-2 py-2.5 text-center ring-1 ring-ink/[0.04]"
            >
              <p className="text-[14px] font-semibold tracking-tight text-ink">
                {it.value}
              </p>
              <p className="text-[10px] uppercase tracking-[0.1em] text-ink-mute">
                {it.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Tier 2: nutrition orientation chips from DB columns ───────────────────
  const orientationChips = getNutritionOrientationChips(restaurant);
  if (orientationChips.length > 0) {
    if (variant === "compact") {
      return (
        <div className="flex flex-wrap gap-1">
          {orientationChips.map((c) => (
            <span
              key={c.label}
              className="rounded-full bg-brand-light/80 px-2 py-0.5 text-[9px] font-semibold text-brand-deep ring-1 ring-brand/15"
            >
              {c.label}
            </span>
          ))}
        </div>
      );
    }
    return (
      <div className="rounded-[20px] bg-brand-soft/60 p-4 ring-1 ring-brand/12 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
          Profil nutritionnel
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {orientationChips.map((c) => (
            <span
              key={c.label}
              className="rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-brand-deep ring-1 ring-brand/20"
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // ── Tier 3: category calorie range (last resort, clearly labelled) ────────
  const calorieRange = getCategoryCalorieRange(restaurant);
  if (calorieRange) {
    if (variant === "compact") {
      return (
        <span
          className="text-[9px] font-medium text-ink-mute"
          title="Estimation HealthyHub par catégorie — pas de mesure exacte."
        >
          {calorieRange} · estimation catégorie
        </span>
      );
    }
    return (
      <div className="rounded-[20px] bg-ink/[0.03] p-4 ring-1 ring-ink/[0.06] sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
            Estimation calorique
          </p>
          <span
            className="text-[10px] font-medium text-ink-mute/70"
            title="Estimation HealthyHub par catégorie — pas de mesure exacte."
          >
            estimation catégorie
          </span>
        </div>
        <p className="mt-2 text-[20px] font-semibold tracking-tight text-ink">
          {calorieRange}
        </p>
      </div>
    );
  }

  return null;
}
