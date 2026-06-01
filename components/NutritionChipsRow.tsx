import type { NutritionChip } from "@/lib/restaurant-credibility";

type Props = {
  chips: NutritionChip[];
  size?: "sm" | "md";
  className?: string;
};

/** Chips nutritionnelles qualitatives (colonnes DB, jamais de chiffres inventés). */
export default function NutritionChipsRow({
  chips,
  size = "sm",
  className = "",
}: Props) {
  if (chips.length === 0) return null;

  const chipClass =
    size === "md"
      ? "rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-brand-deep ring-1 ring-brand/20"
      : "rounded-full bg-brand-light/80 px-2.5 py-0.5 text-[10px] font-semibold text-brand-deep ring-1 ring-brand/15";

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {chips.map((c) => (
        <span key={c.label} className={chipClass}>
          {c.label}
        </span>
      ))}
    </div>
  );
}
