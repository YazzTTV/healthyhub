"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import RestaurantImagePlaceholder from "@/components/RestaurantImagePlaceholder";
import { gradientForCategory } from "@/lib/restaurant-image-ui";
import {
  getRestaurantDishImage,
  getRestaurantHeroImageCandidates,
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

const DEFAULT_SIZES = "(max-width: 768px) 100vw, 33vw";

/**
 * Image restaurant — cascade URL (hiérarchie + repli) + placeholder premium.
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
  const imageDepsKey = [
    restaurant.id ?? "",
    restaurant.restaurant_image_url ?? "",
    restaurant.restaurant_interior_image_url ?? "",
    restaurant.storefront_image_url ?? "",
    restaurant.image_url ?? "",
    restaurant.cover_image_url ?? "",
    restaurant.signature_dish_image_url ?? "",
    restaurant.signature_dish_name ?? "",
    restaurant.image_status ?? "",
    forceDishImage ? "1" : "0",
  ].join("|");

  const resolved = useMemo(
    () =>
      forceDishImage ? getRestaurantDishImage(restaurant) : getRestaurantImage(restaurant),
    [imageDepsKey, forceDishImage, restaurant]
  );

  const candidates = useMemo(() => {
    if (forceDishImage) {
      const dish = getRestaurantDishImage(restaurant);
      return dish.mode === "image" && dish.src ? [dish.src] : [];
    }
    const list = getRestaurantHeroImageCandidates(restaurant);
    if (list.length > 0) return list;
    return resolved.mode === "image" && resolved.src ? [resolved.src] : [];
  }, [imageDepsKey, forceDishImage, restaurant, resolved]);

  const [candidateIndex, setCandidateIndex] = useState(0);
  const [useNativeImg, setUseNativeImg] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setCandidateIndex(0);
    setUseNativeImg(false);
    setExhausted(false);
    setIsLoading(true);
  }, [imageDepsKey, forceDishImage]);

  const activeUrl = exhausted ? null : (candidates[candidateIndex] ?? null);
  const showRemote = activeUrl != null;
  const showDishOverlay =
    !isLoading &&
    showRemote &&
    resolved.imageContext === "dish" &&
    Boolean(dishName?.trim());

  const shimmerGradient = gradientForCategory(restaurant.category);

  const tryNextSource = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((i) => i + 1);
      setUseNativeImg(false);
      setIsLoading(true);
      return;
    }
    if (!useNativeImg && activeUrl) {
      setUseNativeImg(true);
      setIsLoading(true);
      return;
    }
    setExhausted(true);
    setIsLoading(false);
  };

  return (
    <div className="relative h-full w-full">
      {showRemote ? (
        <>
          {useNativeImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${activeUrl}-native`}
              src={activeUrl}
              alt={alt}
              className={className}
              loading={loading}
              onLoad={() => setIsLoading(false)}
              onError={tryNextSource}
            />
          ) : (
            <Image
              key={`${activeUrl}-next`}
              src={activeUrl}
              alt={alt}
              fill
              sizes={sizes}
              loading={loading}
              className={className}
              onLoad={() => setIsLoading(false)}
              onError={tryNextSource}
            />
          )}
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
          cuisine={
            "cuisine" in restaurant
              ? (restaurant as { cuisine?: string | null }).cuisine
              : null
          }
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
