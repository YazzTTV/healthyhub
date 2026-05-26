import type { RestaurantListItem } from "@/lib/types";

/** Statuts livraison / liens pour lesquels le CTA Commander est autorisé. */
export const COMMANDER_ALLOWED_DELIVERY_STATUSES = new Set([
  "VALID_EXACT",
  "VALID_CHAIN_LOCATION_UNCLEAR",
]);

export type OrderProvider = "ubereats" | "deliveroo";

export type BestOrderLink = {
  url: string;
  provider: OrderProvider;
};

export const ORDER_PROVIDER_LABELS: Record<OrderProvider, string> = {
  ubereats: "Uber Eats",
  deliveroo: "Deliveroo",
};

function parseHttpUrl(raw: string | null | undefined): URL | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (!/^https?:$/i.test(u.protocol)) return null;
    return u;
  } catch {
    return null;
  }
}

/**
 * Uber Eats exige en pratique `…/store/{slug}/{storeId}`.
 * Les URLs `…/store/{slug}` seules renvoient la 404 « taco-bout-awkward ».
 */
export function uberEatsPathHasStoreId(pathname: string): boolean {
  const segs = pathname.split("/").filter(Boolean);
  const storeIdx = segs.findIndex((s) => s.toLowerCase() === "store");
  if (storeIdx < 0) return false;
  return segs.length > storeIdx + 2;
}

/** Racine ou locale seule (ex. `/`, `/fr`) — pas une fiche restaurant. */
export function isHomepageOnlyPath(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/") return true;
  const segments = normalizedPath.split("/").filter(Boolean);
  return (
    segments.length === 1 && /^[a-z]{2}(-[a-z]{2})?$/i.test(segments[0])
  );
}

/** Statut plateforme autorisé pour le CTA Commander (si la colonne est renseignée). */
export function isPlatformLinkStatusAllowed(
  status: string | null | undefined
): boolean {
  if (status == null) return true;
  const s = String(status).trim();
  if (s === "") return true;
  return COMMANDER_ALLOWED_DELIVERY_STATUSES.has(s);
}

/**
 * URL Uber Eats utilisable : domaine Uber Eats, chemin `/store/`, pas recherche ni accueil.
 */
export function isValidUberEatsUrl(url: string | null | undefined): boolean {
  const u = parseHttpUrl(url);
  if (!u) return false;
  const host = u.hostname.toLowerCase();
  if (!host.includes("ubereats.com") && !host.includes("uber.com")) return false;
  if (isHomepageOnlyPath(u.pathname)) return false;
  const path = u.pathname.toLowerCase();
  if (path.includes("/search")) return false;
  if (u.searchParams.has("q")) return false;
  if (!path.includes("/store/")) return false;
  return uberEatsPathHasStoreId(u.pathname);
}

/**
 * URL Deliveroo utilisable : domaine Deliveroo, chemin `/menu/`, pas recherche ni accueil.
 */
export function isValidDeliverooUrl(url: string | null | undefined): boolean {
  const u = parseHttpUrl(url);
  if (!u) return false;
  const host = u.hostname.toLowerCase();
  if (!host.includes("deliveroo")) return false;
  if (isHomepageOnlyPath(u.pathname)) return false;
  const path = u.pathname.toLowerCase();
  if (path.includes("/search")) return false;
  if (u.searchParams.has("query")) return false;
  return path.includes("/menu/");
}

export function getValidatedUberEatsUrl(
  restaurant: Pick<RestaurantListItem, "uber_eats_url" | "uber_eats_status">
): string | null {
  const raw = restaurant.uber_eats_url;
  if (!isValidUberEatsUrl(raw)) return null;
  if (!isPlatformLinkStatusAllowed(restaurant.uber_eats_status)) return null;
  return String(raw).trim();
}

export function getValidatedDeliverooUrl(
  restaurant: Pick<RestaurantListItem, "deliveroo_url" | "deliveroo_status">
): string | null {
  const raw = restaurant.deliveroo_url;
  if (!isValidDeliverooUrl(raw)) return null;
  if (!isPlatformLinkStatusAllowed(restaurant.deliveroo_status)) return null;
  return String(raw).trim();
}

/**
 * Lien Commander unique : Uber Eats validé en priorité, sinon Deliveroo.
 */
export function getBestOrderLink(
  restaurant: Pick<
    RestaurantListItem,
    | "uber_eats_url"
    | "uber_eats_status"
    | "deliveroo_url"
    | "deliveroo_status"
  >
): BestOrderLink | null {
  const uber = getValidatedUberEatsUrl(restaurant);
  if (uber) return { url: uber, provider: "ubereats" };
  const deliveroo = getValidatedDeliverooUrl(restaurant);
  if (deliveroo) return { url: deliveroo, provider: "deliveroo" };
  return null;
}
