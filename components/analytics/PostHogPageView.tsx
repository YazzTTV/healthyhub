"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { getPostHog } from "@/lib/posthog-client";

/** Capture `$pageview` sans doublons (App Router). */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastCaptured = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname;
    if (lastCaptured.current === url) return;
    lastCaptured.current = url;

    const client = getPostHog();
    if (!client?.__loaded) return;

    client.capture("$pageview", {
      $current_url: window.location.origin + url,
      path: pathname,
    });
  }, [pathname, searchParams]);

  return null;
}
