"use client";

import { useEffect } from "react";
import { trackRestaurantOpened, type AnalyticsRestaurant } from "@/lib/analytics";
import { pushRecentlyViewed } from "@/lib/recently-viewed";

type Props = AnalyticsRestaurant & {
  image_url: string | null;
  signature_dish_name?: string | null;
  signature_dish_image_url?: string | null;
  image_status?: string | null;
};

export default function RestaurantViewTracker({
  id,
  name,
  image_url,
  signature_dish_name,
  signature_dish_image_url,
  image_status,
  category,
  city,
  slug,
  arrondissement,
  healthy_score,
}: Props) {
  useEffect(() => {
    if (!id || !name) return;
    pushRecentlyViewed({
      id,
      name,
      image_url,
      signature_dish_name: signature_dish_name ?? null,
      signature_dish_image_url: signature_dish_image_url ?? null,
      image_status,
      category,
      city,
    });
    trackRestaurantOpened(
      { id, name, slug, category, arrondissement, healthy_score, city },
      "restaurant_detail"
    );
  }, [
    id,
    name,
    image_url,
    signature_dish_name,
    signature_dish_image_url,
    image_status,
    category,
    city,
    slug,
    arrondissement,
    healthy_score,
  ]);

  return null;
}
