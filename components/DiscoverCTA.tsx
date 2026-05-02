"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

export default function DiscoverCTA() {
  return (
    <Link
      href="/discover"
      onClick={() => {
        void trackEvent({
          event_name: "landing_cta_clicked",
          metadata: { source: "landing_hero" },
        });
      }}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-6 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark hover:shadow-elevated active:translate-y-px"
    >
      Voir la carte des spots
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
