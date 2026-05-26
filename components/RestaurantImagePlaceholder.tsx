type Props = {
  className?: string;
  name?: string;
};

/** Placeholder neutre premium — pas de photo nourriture générique. */
export default function RestaurantImagePlaceholder({
  className = "",
  name,
}: Props) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-brand-light via-cream to-brand-soft ${className}`}
      role="img"
      aria-label={name ? `Aucune photo pour ${name}` : "Photo non disponible"}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/70 shadow-soft ring-1 ring-ink/[0.05]">
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7 text-brand/35"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 20h16M6 20V10l6-4 6 4v10" />
          <path d="M9 20v-6h6v6" />
          <path d="M9 10h6" />
        </svg>
      </div>
      <p className="mt-3 text-[11px] font-medium tracking-wide text-ink-mute/80">
        Photo à venir
      </p>
    </div>
  );
}
