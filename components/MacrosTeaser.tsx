import { estimateMacros } from "@/lib/restaurant-credibility";
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
  const macros = estimateMacros(restaurant);
  if (!macros) return null;

  const items = [
    { label: "kcal", value: macros.kcal },
    { label: "protéines", value: macros.protein },
    { label: "glucides", value: macros.carbs },
    { label: "lipides", value: macros.fat },
  ];

  if (variant === "compact") {
    return (
      <div className="rounded-xl bg-brand-soft/90 px-2.5 py-2 ring-1 ring-brand/12">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-deep">
            Macros estimés
          </p>
          <span
            className="text-[9px] font-medium text-ink-mute"
            title="Estimation HealthyHub — pas de mesure laboratoire."
          >
            estimé
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
          Macros estimés
        </p>
        <span
          className="text-[10.5px] font-medium text-ink-mute"
          title="Estimation HealthyHub fondée sur la catégorie et le profil nutritionnel — pas de mesure laboratoire."
        >
          estimé
        </span>
      </div>
      {dishName ? (
        <p className="mt-1 text-[12.5px] text-ink-soft">
          Sur le plat phare : <span className="font-medium">{dishName}</span>
        </p>
      ) : null}
      <div className="mt-3 grid grid-cols-4 gap-2">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl bg-white px-2 py-2.5 text-center ring-1 ring-ink/[0.04]">
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
