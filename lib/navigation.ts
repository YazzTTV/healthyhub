import type { RestaurantListItem } from "@/lib/types";

/** Maps platform choice for analytics (not the browser name). */
export type NavigationDeviceType = "apple_maps" | "google_maps";

/**
 * Simple, reliable routing: iOS / iPadOS / macOS → Apple Maps;
 * Android and other platforms → Google Maps.
 */
export function getNavigationDeviceType(): NavigationDeviceType {
  if (typeof navigator === "undefined") return "google_maps";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPod/i.test(ua)) return "apple_maps";
  if (/iPad/i.test(ua)) return "apple_maps";
  if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) {
    return "apple_maps";
  }
  if (/Android/i.test(ua)) return "google_maps";
  if (/Macintosh|Mac OS X/i.test(ua)) return "apple_maps";
  return "google_maps";
}

export function getNavigationUrl(
  restaurant: Pick<RestaurantListItem, "latitude" | "longitude">
): string | null {
  const lat = restaurant.latitude;
  const lng = restaurant.longitude;
  if (lat == null || lng == null) return null;
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;

  const kind = getNavigationDeviceType();
  if (kind === "apple_maps") {
    return `http://maps.apple.com/?daddr=${la},${ln}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${la},${ln}`;
}

export function formatDistanceLabel(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1).replace(".", ",")} km`;
}
