import type { AnalyticsRestaurant } from "@/lib/analytics/restaurant-props";

/**
 * Noms d’événements métier HealthyHub (PostHog + persistance éventuelle).
 * Centralisés pour éviter les typos et faciliter les dashboards.
 */
export type HealthyHubBusinessEvent =
  | "discover_opened"
  | "map_moved"
  | "restaurant_marker_clicked"
  | "restaurant_card_clicked"
  | "restaurant_opened"
  | "commander_clicked"
  | "navigation_clicked"
  | "favorite_added"
  | "favorite_removed"
  | "objective_selected"
  | "category_selected"
  | "filter_used"
  | "signup_started"
  | "signup_completed";

/** Surfaces pour `restaurant_card_clicked` (carte, listes, encarts). */
export type RestaurantCardPlacement =
  | "map_popup"
  | "desktop_panel"
  | "floating_card"
  | "restaurant_grid"
  | "best_choice_dish"
  | "best_choice_view"
  | "top_picks_strip"
  | "recently_viewed"
  | "week_strip"
  | "restaurant_card_actions"
  | string;

/** Surfaces pour `restaurant_marker_clicked`. */
export type RestaurantMarkerPlacement = "map_marker" | string;

export type RestaurantClickSurface = "marker" | "card";

export type TrackRestaurantClickOptions = {
  restaurant: AnalyticsRestaurant;
  surface: RestaurantClickSurface;
  /** Où l’utilisateur a cliqué (popup carte, grille accueil, etc.). */
  placement: RestaurantMarkerPlacement | RestaurantCardPlacement;
  extra?: Record<string, unknown>;
};

export type TrackObjectiveSelectionOptions = {
  /** Libellé lisible (ex. titre objectif). */
  objective_name: string;
  /** Clé métier si disponible (ex. code goal). */
  objective_key?: string | null;
  previous_objective_name?: string | null;
  previous_objective_key?: string | null;
  source?: string;
};
