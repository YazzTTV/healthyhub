type Size = "sm" | "md";

export default function VerifiedBadge({
  size = "sm",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const dims =
    size === "md" ? "h-7 px-3 text-[12px]" : "h-6 px-2.5 text-[10.5px]";
  const icon = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-brand text-white font-semibold uppercase tracking-[0.1em] shadow-soft ${dims} ${className}`}
      aria-label="Vérifié par HealthyHub"
      title="Vérifié par HealthyHub : adresse testée par notre équipe"
    >
      <svg
        viewBox="0 0 24 24"
        className={icon}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
      </svg>
      Vérifié
    </span>
  );
}
