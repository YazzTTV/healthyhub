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
      className="inline-flex items-center rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
    >
      Découvrir les restaurants
    </Link>
  );
}
