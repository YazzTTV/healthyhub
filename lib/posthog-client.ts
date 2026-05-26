import posthog from "posthog-js";

const EU_HOST = "https://eu.i.posthog.com";

let initStarted = false;

/** Même valeur SSR / client pour éviter les erreurs d’hydratation. */
export function isPostHogEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

/** Initialise PostHog une seule fois (côté client). */
export function initPostHog(): typeof posthog | null {
  if (typeof window === "undefined") return null;
  if (initStarted) return posthog;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  if (!key) return null;

  initStarted = true;

  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || EU_HOST,
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
      persistence: "localStorage+cookie",
      disable_session_recording: true,
      loaded: (client) => {
        // En dev : `window.posthog.capture("test_event")` dans la console du navigateur
        if (process.env.NODE_ENV === "development") {
          (window as Window & { posthog?: typeof client }).posthog = client;
        }
        client.capture("session_started", {
          path: window.location.pathname,
        });
      },
    });
  }

  return posthog;
}

export function getPostHog(): typeof posthog | null {
  if (!isPostHogEnabled()) return null;
  return initPostHog();
}

export { posthog };
