export type NutritionLevel = "low" | "medium" | "high";

/** Statut d’image renseigné par Manus / Supabase. */
export type RestaurantImageStatus =
  | "VERIFIED_EXACT"
  | "VERIFIED_BRAND"
  | "PLATFORM_IMAGE"
  | "PREMIUM_FALLBACK"
  | "MISSING";

export type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  restaurant_image_url?: string | null;
  restaurant_interior_image_url?: string | null;
  storefront_image_url?: string | null;
  image_url: string | null;
  /** VERIFIED_EXACT, VERIFIED_BRAND, PLATFORM_IMAGE, PREMIUM_FALLBACK, MISSING */
  image_status?: RestaurantImageStatus | string | null;
  image_source_note?: string | null;
  image_source_url?: string | null;
  city: string | null;
  cuisine: string | null;
  category: string | null;
  healthy_score: number | null;
  tags: string[] | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  review_count: number | null;
  website_url: string | null;
  uber_eats_url: string | null;
  /** Ex. VALID_EXACT, VALID_CHAIN_LOCATION_UNCLEAR, NOT_FOUND */
  uber_eats_status?: string | null;
  deliveroo_url: string | null;
  /** Ex. VALID_EXACT, SEARCH_PAGE_ONLY, NOT_FOUND */
  deliveroo_status?: string | null;
  protein_level?: NutritionLevel | string | null;
  /** Legacy — préférer `calorie_density` si présent en base */
  calorie_level?: NutritionLevel | string | null;
  calorie_density?: NutritionLevel | string | null;
  clean_level?: NutritionLevel | string | null;
  recommended_for_weight_loss?: boolean | null;
  recommended_for_muscle_gain?: boolean | null;
  recommended_for_clean_eating?: boolean | null;
  created_at: string | null;
  service_type?: string | null;
  opening_hours?: unknown | null;
  arrondissement?: string | null;
  postal_code?: string | null;
  full_address?: string | null;
  google_maps_url?: string | null;
  google_rating?: number | null;
  google_review_count?: number | null;
  verified_by_healthyhub?: boolean | null;
  healthyhub_editor_note?: string | null;
  why_this_score?: string | null;
  vegan_friendly?: boolean | null;
  gluten_free_possible?: boolean | null;
  breakfast_fit?: boolean | null;
  lunch_light_fit?: boolean | null;
  muscle_recovery_fit?: boolean | null;
  focus_productivity_fit?: boolean | null;
  pleasure_without_cracking_fit?: boolean | null;
  signature_dish_name?: string | null;
  /** Photo du plat signature (repli si `image_url` absent). */
  signature_dish_image_url?: string | null;
  signature_dish_description?: string | null;
  signature_dish_calories?: number | null;
  signature_dish_protein?: number | null;
  signature_dish_carbs?: number | null;
  signature_dish_fats?: number | null;
  macro_confidence?: "LOW" | "MEDIUM" | "HIGH" | string | null;
  takeaway_possible?: boolean | null;
  dine_in_possible?: boolean | null;
  delivery_possible?: boolean | null;
  /** Validation des liens / géoloc livraison — contrôle l’affichage du CTA Commander. */
  delivery_status?: string | null;
  public_email?: string | null;
  instagram_url?: string | null;
  phone?: string | null;
  /** Score agrégé (table / vue `restaurant_scores` ou colonne plate si présente). */
  score_global?: number | null;
  /** Résumé court pour SEO / OG (si colonne en base). */
  llm_summary?: string | null;
  /** Points menu éditoriaux factuels (3-4 puces). */
  menu_highlights?: string[] | null;
  /** Image Open Graph dédiée (sinon `image_url`). */
  cover_image_url?: string | null;
};

/** Liste / carte / fiches : même modèle que `Restaurant` (champs optionnels selon le `select`). */
export type RestaurantListItem = Restaurant;
