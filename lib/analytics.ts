"use client";

import posthog from "posthog-js";

type EventPayload = {
  event_name: string;
  restaurant_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

let posthogInitialized = false;

function initPosthog() {
  if (posthogInitialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: false,
  });
  posthogInitialized = true;
}

export async function trackEvent(payload: EventPayload) {
  initPosthog();

  if (posthogInitialized) {
    posthog.capture(payload.event_name, {
      restaurant_id: payload.restaurant_id ?? null,
      ...(payload.metadata ?? {}),
    });
  }

  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Never block UX for analytics.
    // eslint-disable-next-line no-console
    console.warn("[analytics] failed to send event", error);
  }
}
