"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import RestaurantImagePlaceholder from "@/components/RestaurantImagePlaceholder";
import { gradientForCategory } from "@/lib/restaurant-image-ui";
import {
  getRestaurantDishImage,
  getRestaurantImage,
  type RestaurantImageSource,
} from "@/lib/restaurant-images";

type Props = {
  restaurant: RestaurantImageSource;
  className?: string;
  alt: string;
  loading?: "lazy" | "eager";
  sizes?: string;
  /** Nom du plat — overlay uniquement si imageContext === "dish". */
  dishName?: string | null;
  /** Affiche uniquement signature_dish_image_url (section plat phare). */
  forceDishImage?: boolean;
  /** compact = carte ; hero = fiche détail avec label « Plat phare ». */
  dishOverlayVariant?: "compact" | "hero";
};

const imgDeps = (r: RestaurantImageSource) => [
  r.id,
  r.image_url,
  r.cover_image_url,
  r.signature_dish_image_url,
  r.signature_dish_name,
  r.image_status,
];

const DEFAULT_SIZES = "(max-width: 768px) 100vw, 33vw";

/**
 * Image restaurant — waterfall + overlay nom du plat (pas de badge de source).
 */
export default function RestaurantImage({
  restaurant,
  className = "object-cover",
  alt,
  loading = "lazy",
  sizes = DEFAULT_SIZES,
  dishName,
  forceDishImage = false,
  dishOverlayVariant = "compact",
}: Props) {
  const resolved = useMemo(
    () => (forceDishImage ? getRestaurantDishImage(restaurant) : getRestaurantImage(restaurant)),
    [...imgDeps(restaurant), forceDishImage]
  );
  const [hasFailed, setHasFailed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHasFailed(false);
    setIsLoading(true);
  }, [...imgDeps(restaurant), forceDishImage]);

  const activeUrl = !hasFailed ? resolved.src : null;
  const showRemote = resolved.mode === "image" && activeUrl != null;
  const showDishOverlay =
    !isLoading &&
    showRemote &&
    resolved.imageContext === "dish" &&
    Boolean(dishName?.trim());

  const shimmerGradient = gradientForCategory(restaurant.category);

  return (
    <div className="relative h-full w-full">
      {showRemote ? (
        <>
          <Image
            key={activeUrl}
            src={activeUrl}
            alt={alt}
            fill
            sizes={sizes}
            loading={loading}
            className={className}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasFailed(true);
              setIsLoading(false);
            }}
          />
          <div
            className={`absolute inset-0 animate-pulse bg-gradient-to-br ${shimmerGradient} transition-opacity duration-300`}
            style={{ opacity: isLoading ? 1 : 0 }}
            aria-hidden
          />
        </>
      ) : (
        <RestaurantImagePlaceholder
          name={alt}
          category={restaurant.category}
          className={className}
        />
      )}

      {showDishOverlay ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent px-3 pb-2.5 pt-8">
          {dishOverlayVariant === "hero" ? (
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                Plat phare
              </p>
              <p className="truncate text-[15px] font-semibold tracking-tight text-white">
                {dishName}
              </p>
            </div>
          ) : (
            <p className="truncate text-[11px] font-semibold tracking-wide text-white/90">
              {dishName}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
