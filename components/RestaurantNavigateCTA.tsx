"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { trackEvent } from "@/lib/analytics";
import { calculateDistanceKm } from "@/lib/geo";
import {
  formatDistanceLabel,
  getNavigationDeviceType,
  getNavigationUrl,
} from "@/lib/navigation";
import type { RestaurantListItem } from "@/lib/types";

function useDistanceKmWhenNeeded(
  lat: number | null,
  lng: number | null,
  enabled: boolean
): number | null {
  const [km, setKm] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled || lat == null || lng == null) return;
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const from: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const to: [number, number] = [Number(lat), Number(lng)];
        setKm(calculateDistanceKm(from, to));
      },
      () => setKm(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 120_000 }
    );
  }, [enabled, lat, lng]);
  return km;
}

export type NavigateSize = "sm" | "md" | "lg";

type Props = {
  restaurant: Pick<RestaurantListItem, "id" | "name" | "latitude" | "longitude">;
  /** Analytics / history context */
  source: string;
  /** True when Uber Eats or Deliveroo link exists — navigate stays secondary. */
  hasOrderLinks: boolean;
  size?: NavigateSize;
  /** Show 📍 distance line when coords exist (uses prop or one-shot geolocation). */
  showDistance?: boolean;
  distanceKm?: number | null;
  className?: string;
  /** Extra classes for the button only */
  buttonClassName?: string;
  /** Ex. analytics contexte parent (meilleur choix, fiche, etc.) */
  onNavigatePress?: () => void;
};

const sizeClasses: Record<
  NavigateSize,
  { btn: string; dist: string }
> = {
  sm: {
    btn: "h-8 min-h-[36px] px-3 text-[12px]",
    dist: "text-[10.5px]",
  },
  md: {
    btn: "h-9 min-h-[44px] px-3 text-[12.5px]",
    dist: "text-[11px]",
  },
  lg: {
    btn: "h-12 min-h-[48px] px-5 text-[14px]",
    dist: "text-[12.5px]",
  },
};

export default function RestaurantNavigateCTA({
  restaurant,
  source,
  hasOrderLinks,
  size = "md",
  showDistance = false,
  distanceKm: distanceKmProp,
  className,
  buttonClassName,
  onNavigatePress,
}: Props) {
  const url = getNavigationUrl(restaurant);
  const inferFromGeo =
    distanceKmProp === undefined &&
    showDistance &&
    restaurant.latitude != null &&
    restaurant.longitude != null;
  const hookedKm = useDistanceKmWhenNeeded(
    restaurant.latitude ?? null,
    restaurant.longitude ?? null,
    inferFromGeo
  );
  const distanceKm =
    distanceKmProp !== undefined ? distanceKmProp : inferFromGeo ? hookedKm : null;

  const primary = Boolean(url && !hasOrderLinks);

  const handleNavigate = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!url) return;
    onNavigatePress?.();
    void trackEvent({
      event_name: "navigation_clicked",
      restaurant_id: restaurant.id,
      metadata: {
        restaurant_name: restaurant.name,
        device_type: getNavigationDeviceType(),
        source,
      },
    });
    void trackEvent({
      event_name: "restaurant_navigation_clicked",
      restaurant_id: restaurant.id,
      metadata: {
        restaurant_name: restaurant.name,
        device_type: getNavigationDeviceType(),
        source,
      },
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const sizes = sizeClasses[size];

  if (!url) {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-ink/[0.04] px-3 py-2 text-center text-[12px] font-medium text-ink/45 ${className ?? ""}`}
      >
        Adresse bientôt disponible
      </span>
    );
  }

  return (
    <div className={className}>
      {showDistance && distanceKm != null ? (
        <p className={`mb-1 flex flex-wrap items-center gap-1 text-ink/60 ${sizes.dist}`}>
          <span aria-hidden>📍</span>
          <span>{formatDistanceLabel(distanceKm)}</span>
          <span aria-hidden title="Itinéraire">
            · 🚶
          </span>
        </p>
      ) : null}
      <button
        type="button"
        onClick={(e) => handleNavigate(e)}
        className={`inline-flex flex-1 shrink-0 items-center justify-center gap-1.5 rounded-full font-semibold transition duration-250 ease-out-expo active:translate-y-px ${
          primary
            ? "bg-brand text-white shadow-soft hover:bg-brand-dark"
            : "bg-white text-brand shadow-sm ring-1 ring-brand/35 hover:bg-brand-light/60"
        } ${sizes.btn} ${buttonClassName ?? ""}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-[1em] w-[1em] shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
        S&apos;y rendre
      </button>
    </div>
  );
}
