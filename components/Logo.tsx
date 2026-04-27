type LogoProps = {
  className?: string;
  showWordmark?: boolean;
};

export default function Logo({
  className = "",
  showWordmark = true,
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        className="h-9 w-9"
        aria-label="HealthyHub logo"
        role="img"
      >
        {/* Rounded square background */}
        <rect width="48" height="48" rx="12" fill="#1f4a36" />

        {/* Double H monogram */}
        <g
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        >
          {/* First H */}
          <line x1="12" y1="14" x2="12" y2="34" />
          <line x1="20" y1="14" x2="20" y2="34" />
          <line x1="12" y1="24" x2="20" y2="24" />
          {/* Second H */}
          <line x1="28" y1="14" x2="28" y2="34" />
          <line x1="36" y1="14" x2="36" y2="34" />
          <line x1="28" y1="24" x2="36" y2="24" />
        </g>

        {/* Leaf accent */}
        <path
          d="M38 8 Q44 8 44 14 Q44 16 42 16 Q36 16 36 10 Q36 8 38 8 Z"
          fill="#86efac"
        />
      </svg>

      {showWordmark ? (
        <span className="flex items-baseline gap-0.5 text-lg font-semibold tracking-tight text-ink">
          Healthy<span className="text-brand">Hub</span>
        </span>
      ) : null}
    </span>
  );
}
