import type { TrustImageTone } from "@/lib/restaurant-images";

const TONE_CLASSES: Record<
  TrustImageTone,
  string
> = {
  verified:
    "bg-white/90 text-brand-deep ring-brand/25 shadow-sm backdrop-blur-sm",
  brand:
    "bg-white/90 text-ink/80 ring-ink/12 shadow-sm backdrop-blur-sm",
  indicative:
    "bg-white/85 text-ink/70 ring-ink/10 shadow-sm backdrop-blur-sm",
};

type Props = {
  label: string;
  tone: TrustImageTone;
  className?: string;
};

/** Pastille discrète sur l’image (confiance source). */
export default function RestaurantImageBadge({
  label,
  tone,
  className = "",
}: Props) {
  return (
    <span
      className={`pointer-events-none absolute bottom-2 left-2 z-[1] max-w-[calc(100%-1rem)] truncate rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ring-1 ${TONE_CLASSES[tone]} ${className}`}
    >
      {label}
    </span>
  );
}
