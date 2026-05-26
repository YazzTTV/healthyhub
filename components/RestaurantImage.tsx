"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import RestaurantImageBadge from "@/components/RestaurantImageBadge";
import RestaurantImagePlaceholder from "@/components/RestaurantImagePlaceholder";
import {
  getTrustedRestaurantImage,
  type RestaurantImageSource,
} from "@/lib/restaurant-images";

type Props = {
  restaurant: RestaurantImageSource;
  className?: string;
  alt: string;
  loading?: "lazy" | "eager";
  sizes?: string;
  /** Masque le badge de confiance (ex. vignettes très petites). */
  hideBadge?: boolean;
};

const imgDeps = (r: RestaurantImageSource) => [
  r.id,
  r.image_url,
  r.image_status,
  r.image_source_note,
  r.image_source_url,
];

const DEFAULT_SIZES = "(max-width: 768px) 100vw, 33vw";

/**
 * Affiche l’image restaurant selon image_status (sources vérifiées uniquement).
 * Placeholder neutre si manquante ; badge de confiance si applicable.
 */
export default function RestaurantImage({
  restaurant,
  className = "object-cover",
  alt,
  loading = "lazy",
  sizes = DEFAULT_SIZES,
  hideBadge = false,
}: Props) {
  const trusted = useMemo(
    () => getTrustedRestaurantImage(restaurant),
    imgDeps(restaurant)
  );

  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, imgDeps(restaurant));

  const showImage =
    trusted.mode === "image" && trusted.src && !loadFailed;

  return (
    <div className="relative h-full w-full">
      {showImage ? (
        <Image
          src={trusted.src!}
          alt={alt}
          fill
          sizes={sizes}
          loading={loading}
          className={className}
          onError={() => setLoadFailed(true)}
        />
      ) : (
        <RestaurantImagePlaceholder name={alt} className={className} />
      )}
      {showImage &&
      !hideBadge &&
      trusted.badgeLabel &&
      trusted.badgeTone ? (
        <RestaurantImageBadge
          label={trusted.badgeLabel}
          tone={trusted.badgeTone}
        />
      ) : null}
    </div>
  );
}
