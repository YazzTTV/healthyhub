import type { TrustedRestaurantImageTone } from "@/lib/restaurant-images";

const TONE_CLASSES: Record<
  NonNullable<TrustedRestaurantImageTone>,
  string
> = {
  verified:
    "bg-white/95 text-brand-deep ring-1 ring-brand/15 backdrop-blur-sm",
  brand:
    "bg-white/95 text-ink-soft ring-1 ring-ink/10 backdrop-blur-sm",
  indicative:
    "bg-ink/55 text-white/95 backdrop-blur-sm",
};

export default function RestaurantImageBadge({
  label,
  tone,
  className = "",
}: {
  label: string;
  tone: NonNullable<TrustedRestaurantImageTone>;
  className?: string;
}) {
  return (
    <span
      className={`pointer-events-none absolute bottom-2.5 left-2.5 z-[1] inline-flex max-w-[calc(100%-1.25rem)] items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.02em] shadow-soft ${TONE_CLASSES[tone]} ${className}`}
    >
      {label}
    </span>
  );
}
