"use client";

import { getPostHog, isPostHogEnabled } from "@/lib/posthog-client";
import {
  restaurantAnalyticsProps,
  type AnalyticsRestaurant,
} from "@/lib/analytics/restaurant-props";
import type {
  HealthyHubBusinessEvent,
  TrackObjectiveSelectionOptions,
  TrackRestaurantClickOptions,
} from "@/lib/analytics/schema";
import { ORDER_PROVIDER_LABELS, type OrderProvider } from "@/lib/order-links";

export type { AnalyticsRestaurant } from "@/lib/analytics/restaurant-props";
export type {
  HealthyHubBusinessEvent,
  RestaurantCardPlacement,
  RestaurantClickSurface,
  RestaurantMarkerPlacement,
  TrackObjectiveSelectionOptions,
  TrackRestaurantClickOptions,
} from "@/lib/analytics/schema";

export type EventPayload = {
  event_name: string;
  restaurant_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export { recentlyViewedEntryToAnalytics } from "@/lib/analytics/restaurant-props";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Évite les doubles `discover_opened` en React 18 Strict Mode (dev). */
let lastDiscoverOpenedAt = 0;

function capturePostHog(
  eventName: string,
  properties: Record<string, unknown>
): void {
  if (!isBrowser() || !isPostHogEnabled()) return;
  const client = getPostHog();
  if (!client?.__loaded) return;
  client.capture(eventName, properties);
}

async function persistEvent(payload: EventPayload): Promise<void> {
  if (!isBrowser()) return;
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* analytics must never block UX */
  }
}

function compactProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(props).filter(([, v]) => v !== undefined)
  );
}

/** Envoie un événement vers PostHog + persistance serveur (best-effort). */
export async function trackEvent(payload: EventPayload): Promise<void> {
  if (!isBrowser()) return;

  const properties = compactProps({
    restaurant_id: payload.restaurant_id ?? null,
    ...(payload.metadata ?? {}),
  });

  capturePostHog(payload.event_name, properties);
  await persistEvent(payload);
}

function fireEvent(
  eventName: HealthyHubBusinessEvent | string,
  props: Record<string, unknown>,
  restaurantId?: string | null
): void {
  void trackEvent({
    event_name: eventName,
    restaurant_id: restaurantId ?? (props.restaurant_id as string | null) ?? null,
    metadata: props,
  });
}

// ——— Helpers réutilisables (API métier) ———

/**
 * Point d’entrée unique pour clic marqueur vs carte resto.
 * Émet `restaurant_marker_clicked` ou `restaurant_card_clicked`.
 */
export function trackRestaurantClick(options: TrackRestaurantClickOptions): void {
  const { restaurant, surface, placement, extra } = options;
  const meta = restaurantAnalyticsProps(restaurant, {
    interaction: surface === "marker" ? "marker" : "card",
    placement,
    ...extra,
  });
  const name: HealthyHubBusinessEvent =
    surface === "marker" ? "restaurant_marker_clicked" : "restaurant_card_clicked";
  fireEvent(name, meta, restaurant.id);
}

/** CTA Commander (Uber Eats / Deliveroo) avec `provider` + libellé lisible. */
export function trackCommanderClick(
  restaurant: AnalyticsRestaurant,
  provider: OrderProvider,
  source: string,
  extra?: Record<string, unknown>
): void {
  const meta = restaurantAnalyticsProps(restaurant, {
    provider,
    provider_label: ORDER_PROVIDER_LABELS[provider],
    source,
    ...extra,
  });
  fireEvent("commander_clicked", meta, restaurant.id);
  trackDeliveryLinkClicked(restaurant, provider, restaurant.id);
}

/**
 * Sélection d’objectif Discover (libellé + contexte).
 * Préférer ce helper à un `capture` brut.
 */
export function trackObjectiveSelection(
  options: TrackObjectiveSelectionOptions
): void {
  const {
    objective_name,
    objective_key,
    previous_objective_name,
    previous_objective_key,
    source = "discover_goal_sheet",
  } = options;
  fireEvent(
    "objective_selected",
    compactProps({
      objective_name,
      objective_key: objective_key ?? null,
      previous_objective_name: previous_objective_name ?? null,
      previous_objective_key: previous_objective_key ?? null,
      source,
    })
  );
}

// ——— Discovery ———

export function trackDiscoverOpened(metadata?: Record<string, unknown>): void {
  if (!isBrowser()) return;
  const now = Date.now();
  if (now - lastDiscoverOpenedAt < 1200) return;
  lastDiscoverOpenedAt = now;
  void trackEvent({ event_name: "discover_opened", metadata });
}

export function trackMapMoved(metadata: {
  lat: number;
  lng: number;
  zoom: number;
}): void {
  void trackEvent({ event_name: "map_moved", metadata });
}

export function trackRestaurantMarkerClick(
  restaurant: AnalyticsRestaurant,
  placement: string = "map_marker"
): void {
  trackRestaurantClick({
    restaurant,
    surface: "marker",
    placement,
  });
}

export function trackRestaurantCardClick(
  restaurant: AnalyticsRestaurant,
  placement: string
): void {
  trackRestaurantClick({
    restaurant,
    surface: "card",
    placement,
  });
}

// ——— Restaurant engagement ———

export function trackRestaurantOpened(
  restaurant: AnalyticsRestaurant,
  source = "restaurant_detail"
): void {
  const props = restaurantAnalyticsProps(restaurant, { source });
  fireEvent("restaurant_opened", props, restaurant.id);
  fireEvent(
    "restaurant_viewed",
    {
      ...props,
      restaurant_id: restaurant.id,
      score:
        restaurant.healthy_score != null
          ? Number(restaurant.healthy_score)
          : null,
    },
    restaurant.id
  );
}

/** Clic lien livraison (Uber Eats / Deliveroo) — événement produit PostHog. */
export function trackDeliveryLinkClicked(
  restaurant: AnalyticsRestaurant,
  platform: string,
  restaurantId?: string
): void {
  const id = restaurantId ?? restaurant.id;
  fireEvent(
    "delivery_link_clicked",
    {
      platform,
      restaurant_id: id,
      restaurant_name: restaurant.name,
      score:
        restaurant.healthy_score != null
          ? Number(restaurant.healthy_score)
          : null,
    },
    id
  );
}

export function trackNavigationClick(
  restaurant: Pick<AnalyticsRestaurant, "id" | "name"> &
    Partial<AnalyticsRestaurant>,
  metadata: Record<string, unknown>
): void {
  const hasRichContext = [
    restaurant.category,
    restaurant.healthy_score,
    restaurant.arrondissement,
    restaurant.city,
    restaurant.slug,
  ].some((v) => v !== undefined);

  const rich = hasRichContext
    ? restaurantAnalyticsProps(restaurant as AnalyticsRestaurant, metadata)
    : {
        restaurant_name: restaurant.name,
        ...metadata,
      };
  fireEvent("navigation_clicked", rich, restaurant.id);
}

export function trackFavoriteAdded(
  restaurant: AnalyticsRestaurant,
  metadata?: Record<string, unknown>
): void {
  fireEvent(
    "favorite_added",
    restaurantAnalyticsProps(restaurant, metadata),
    restaurant.id
  );
}

export function trackFavoriteRemoved(
  restaurant: AnalyticsRestaurant,
  metadata?: Record<string, unknown>
): void {
  fireEvent(
    "favorite_removed",
    restaurantAnalyticsProps(restaurant, metadata),
    restaurant.id
  );
}

// ——— Objectives & filters ———

/** Compat : préférer `trackObjectiveSelection`. */
export function trackObjectiveSelected(objectiveName: string): void {
  trackObjectiveSelection({
    objective_name: objectiveName,
    source: "legacy_direct",
  });
}

export function trackCategorySelected(
  category: string,
  context?: { objective_name?: string | null; source?: string }
): void {
  fireEvent(
    "category_selected",
    compactProps({
      category,
      objective_name: context?.objective_name ?? null,
      source: context?.source ?? "discover_filters",
    })
  );
}

export function trackFilterUsed(metadata: Record<string, unknown>): void {
  const filter_type =
    (metadata.filter_type as string | undefined) ??
    (metadata.filter as string | undefined) ??
    (metadata.sort as string | undefined) ??
    "discover";
  void trackEvent({
    event_name: "filter_used",
    metadata: { ...metadata, filter_type },
  });
}

// ——— Auth ———

export function trackSignupStarted(metadata?: Record<string, unknown>): void {
  void trackEvent({ event_name: "signup_started", metadata });
}

export function trackSignupCompleted(metadata?: Record<string, unknown>): void {
  void trackEvent({ event_name: "signup_completed", metadata });
}

// ——— Optional engagement ———

export function trackScrollDepth(page: string, depthPercent: number): void {
  void trackEvent({
    event_name: "scroll_depth",
    metadata: { page, depth_percent: depthPercent },
  });
}

export function trackTimeOnDiscover(seconds: number): void {
  void trackEvent({
    event_name: "time_on_discover",
    metadata: { seconds },
  });
}

// ——— Legacy / encarts ———

export function trackBestChoiceViewed(
  restaurantId: string,
  metadata?: Record<string, unknown>
): void {
  void trackEvent({
    event_name: "best_choice_viewed",
    restaurant_id: restaurantId,
    metadata,
  });
}

export function trackBestChoiceClicked(
  restaurantId: string,
  metadata?: Record<string, unknown>
): void {
  void trackEvent({
    event_name: "best_choice_clicked",
    restaurant_id: restaurantId,
    metadata,
  });
}
