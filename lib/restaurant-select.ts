/** Colonnes Supabase — ordre des tentatives : plein → noyau → base (colonnes manquantes). */

export const RESTAURANT_SELECT_BASE =
  "id, slug, name, restaurant_image_url, restaurant_interior_image_url, storefront_image_url, image_url, image_status, image_source_note, image_source_url, signature_dish, signature_dish_image_url, city, cuisine, category, healthy_score, tags, latitude, longitude, rating, review_count, uber_eats_url, deliveroo_url";
export const RESTAURANT_SELECT_BASE_LEGACY =
  "id, slug, name, image_url, image_status, image_source_note, image_source_url, signature_dish, signature_dish_image_url, city, cuisine, category, healthy_score, tags, latitude, longitude, rating, review_count, uber_eats_url, deliveroo_url";

export const RESTAURANT_SELECT_CORE = `${RESTAURANT_SELECT_BASE}, description, website_url, protein_level, calorie_level, calorie_density, clean_level, recommended_for_weight_loss, recommended_for_muscle_gain, recommended_for_clean_eating, created_at, service_type, opening_hours`;
export const RESTAURANT_SELECT_CORE_LEGACY = `${RESTAURANT_SELECT_BASE_LEGACY}, description, website_url, protein_level, calorie_level, calorie_density, clean_level, recommended_for_weight_loss, recommended_for_muscle_gain, recommended_for_clean_eating, created_at, service_type, opening_hours`;

export const RESTAURANT_SELECT_FULL = `${RESTAURANT_SELECT_CORE}, arrondissement, postal_code, full_address, google_maps_url, google_rating, google_review_count, verified_by_healthyhub, healthyhub_editor_note, why_this_score, vegan_friendly, gluten_free_possible, breakfast_fit, lunch_light_fit, muscle_recovery_fit, focus_productivity_fit, pleasure_without_cracking_fit, signature_dish_description, signature_dish_calories, signature_dish_protein, signature_dish_carbs, signature_dish_fats, macro_confidence, menu_highlights, takeaway_possible, dine_in_possible, delivery_possible, delivery_status, uber_eats_status, deliveroo_status, public_email, instagram_url, phone`;
export const RESTAURANT_SELECT_FULL_LEGACY = `${RESTAURANT_SELECT_CORE_LEGACY}, arrondissement, postal_code, full_address, google_maps_url, google_rating, google_review_count, verified_by_healthyhub, healthyhub_editor_note, why_this_score, vegan_friendly, gluten_free_possible, breakfast_fit, lunch_light_fit, muscle_recovery_fit, focus_productivity_fit, pleasure_without_cracking_fit, signature_dish_description, signature_dish_calories, signature_dish_protein, signature_dish_carbs, signature_dish_fats, macro_confidence, menu_highlights, takeaway_possible, dine_in_possible, delivery_possible, delivery_status, uber_eats_status, deliveroo_status, public_email, instagram_url, phone`;

export const RESTAURANT_SELECT_ENRICHED_EMBED = `${RESTAURANT_SELECT_FULL}, llm_summary, cover_image_url, restaurant_scores(score_global)`;
export const RESTAURANT_SELECT_ENRICHED_EMBED_LEGACY = `${RESTAURANT_SELECT_FULL_LEGACY}, llm_summary, cover_image_url, restaurant_scores(score_global)`;

export const RESTAURANT_SELECT_ENRICHED_FLAT = `${RESTAURANT_SELECT_FULL}, llm_summary, cover_image_url, score_global`;
export const RESTAURANT_SELECT_ENRICHED_FLAT_LEGACY = `${RESTAURANT_SELECT_FULL_LEGACY}, llm_summary, cover_image_url, score_global`;
