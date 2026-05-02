export type Restaurant = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  image_url: string | null;
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
  deliveroo_url: string | null;
  protein_level: "low" | "medium" | "high" | null;
  calorie_level: "low" | "medium" | "high" | null;
  clean_level: "low" | "medium" | "high" | null;
  recommended_for_weight_loss: boolean | null;
  recommended_for_muscle_gain: boolean | null;
  recommended_for_clean_eating: boolean | null;
  created_at: string;
  /** Présent si la colonne existe en base */
  service_type?: string | null;
  opening_hours?: unknown | null;
};

export type RestaurantListItem = Pick<
  Restaurant,
  | "id"
  | "name"
  | "image_url"
  | "city"
  | "cuisine"
  | "category"
  | "healthy_score"
  | "slug"
  | "tags"
  | "latitude"
  | "longitude"
  | "rating"
  | "review_count"
  | "uber_eats_url"
  | "deliveroo_url"
  | "created_at"
> &
  Partial<
    Pick<
      Restaurant,
      | "protein_level"
      | "calorie_level"
      | "clean_level"
      | "recommended_for_weight_loss"
      | "recommended_for_muscle_gain"
      | "recommended_for_clean_eating"
      | "service_type"
      | "opening_hours"
    >
  >;
