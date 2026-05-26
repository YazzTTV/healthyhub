"use client";

import { useEffect } from "react";
import { getPostHog } from "@/lib/posthog-client";
import { supabase } from "@/lib/supabase";
import { trackSignupCompleted } from "@/lib/analytics";

/** Associe l’utilisateur connecté à PostHog ; anonyme sinon. */
export function PostHogIdentify() {
  useEffect(() => {
    const client = getPostHog();
    if (!client) return;

    const applySession = (userId: string | null, email?: string | null) => {
      if (userId) {
        client.identify(userId, {
          email: email ?? undefined,
        });
      } else {
        client.reset();
      }
    };

    void supabase.auth.getUser().then(({ data }) => {
      applySession(data.user?.id ?? null, data.user?.email);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user;
      applySession(user?.id ?? null, user?.email);

      if (event === "SIGNED_IN" && user) {
        const signupAgeMs = Date.now() - new Date(user.created_at).getTime();
        if (signupAgeMs >= 0 && signupAgeMs < 20 * 60 * 1000) {
          trackSignupCompleted({
            auth_event: event,
            has_email: Boolean(user.email),
            signup_age_ms: signupAgeMs,
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
