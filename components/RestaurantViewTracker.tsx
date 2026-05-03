"use client";

import { useEffect } from "react";
import { pushRecentlyViewed } from "@/lib/recently-viewed";

type Props = {
  id: string;
  name: string;
  image_url: string | null;
  category: string | null;
  city: string | null;
};

export default function RestaurantViewTracker({
  id,
  name,
  image_url,
  category,
  city,
}: Props) {
  useEffect(() => {
    if (!id || !name) return;
    pushRecentlyViewed({ id, name, image_url, category, city });
  }, [id, name, image_url, category, city]);

  return null;
}
