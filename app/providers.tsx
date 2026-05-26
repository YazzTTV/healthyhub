"use client";

import { Suspense, useEffect } from "react";
import { PostHogProvider } from "posthog-js/react";
import { initPostHog, isPostHogEnabled, posthog } from "@/lib/posthog-client";
import { PostHogPageView } from "@/components/analytics/PostHogPageView";
import { PostHogIdentify } from "@/components/analytics/PostHogIdentify";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  if (!isPostHogEnabled()) {
    return <>{children}</>;
  }

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      <PostHogIdentify />
      {children}
    </PostHogProvider>
  );
}
