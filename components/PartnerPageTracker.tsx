"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function PartnerPageTracker() {
  useEffect(() => {
    void trackEvent({ event_name: "partner_page_opened" });
  }, []);

  return null;
}
