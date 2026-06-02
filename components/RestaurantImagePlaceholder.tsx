import {
  categoryDisplayLabel,
  cuisineDisplayLabel,
  gradientForCategory,
} from "@/lib/restaurant-image-ui";

type Props = {
  className?: string;
  name?: string;
  category?: string | null;
  cuisine?: string | null;
};

function iconForCategory(category?: string | null): string {
  const value = (category ?? "").toLowerCase();
  if (value.includes("poke") || value.includes("salad") || value.includes("salade")) {
    return "leaf";
  }
  if (value.includes("vegan")) return "sprout";
  if (value.includes("burger") || value.includes("protein")) return "bolt";
  if (value.includes("brunch") || value.includes("matcha")) return "sun";
  return "bowl";
}

function renderIcon(kind: string) {
  if (kind === "leaf") {
    return <path d="M7 16c4.5.2 7.5-2.2 10-7-5 .2-8 2.3-10 7Zm0 0c.4-2.2 1.9-3.9 4-5" />;
  }
  if (kind === "sprout") {
    return (
      <>
        <path d="M12 19v-6" />
        <path d="M12 13c-2.8 0-5-2.2-5-5 2.8 0 5 2.2 5 5Z" />
        <path d="M12 13c2.8 0 5-2.2 5-5-2.8 0-5 2.2-5 5Z" />
      </>
    );
  }
  if (kind === "bolt") {
    return <path d="m13 3-6 9h4l-1 9 7-11h-4l0-7Z" />;
  }
  if (kind === "sun") {
    return (
      <>
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
      </>
    );
  }
  return (
    <>
      <path d="M5.5 10.5h13" />
      <path d="M7 10.5 8.6 18h6.8l1.6-7.5" />
      <path d="M9 7.5c.4-1 1.1-1.5 2-1.5s1.6.5 2 1.5" />
    </>
  );
}

/** Fallback premium quand aucune photo n’est disponible. */
export default function RestaurantImagePlaceholder({
  className = "",
  name,
  category,
  cuisine,
}: Props) {
  const icon = iconForCategory(category);
  const gradient = gradientForCategory(category);
  const categoryLabel = categoryDisplayLabel(category);
  const cuisineLabel = cuisineDisplayLabel(cuisine);

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br ${gradient} ${className}`}
      role="img"
      aria-label={
        name ? `Aucune photo pour ${name}` : "Photo non disponible"
      }
    >
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -left-6 top-3 h-16 w-16 rounded-full bg-white/55 blur-xl" />
        <div className="absolute -right-8 bottom-1 h-20 w-20 rounded-full bg-brand/10 blur-xl" />
      </div>
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 shadow-soft ring-1 ring-ink/[0.06]">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 text-brand-dark/70"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {renderIcon(icon)}
        </svg>
      </div>
      {categoryLabel ? (
        <p className="relative mt-3 max-w-[85%] truncate text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/55">
          {categoryLabel}
        </p>
      ) : null}
      {cuisineLabel && cuisineLabel !== categoryLabel ? (
        <p className="relative mt-1 max-w-[85%] truncate text-center text-[11px] text-ink-mute/70">
          {cuisineLabel}
        </p>
      ) : null}
      <p className="relative mt-2 text-[10px] font-medium text-ink-mute/50">
        Photo non disponible
      </p>
    </div>
  );
}
