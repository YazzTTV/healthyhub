"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getRestaurantImage,
  getRestaurantImageFromPool,
  RESTAURANT_IMAGE_ULTIMATE_FALLBACK,
  type RestaurantImageSource,
} from "@/lib/restaurant-images";

type Props = {
  restaurant: RestaurantImageSource;
  className?: string;
  alt: string;
  loading?: "lazy" | "eager";
};

/**
 * Affiche l’image restaurant (URL base si crédible, sinon pool Unsplash).
 * En cas d’échec de chargement, enchaîne pool puis image de secours fixe.
 */
export default function RestaurantImage({
  restaurant,
  className,
  alt,
  loading = "lazy",
}: Props) {
  const candidates = useMemo(() => {
    const primary = getRestaurantImage(restaurant);
    const pool = getRestaurantImageFromPool(restaurant);
    const u = RESTAURANT_IMAGE_ULTIMATE_FALLBACK;
    return [...new Set([primary, pool, u])];
  }, [
    restaurant.id,
    restaurant.image_url,
    restaurant.slug,
    restaurant.name,
    restaurant.category,
  ]);

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [
    restaurant.id,
    restaurant.image_url,
    restaurant.slug,
    restaurant.name,
    restaurant.category,
  ]);

  const src =
    candidates[Math.min(idx, candidates.length - 1)] ??
    RESTAURANT_IMAGE_ULTIMATE_FALLBACK;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => {
        setIdx((i) => (i < candidates.length - 1 ? i + 1 : i));
      }}
    />
  );
}
