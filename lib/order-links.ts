import type { RestaurantListItem } from "@/lib/types";

/** Statuts plateforme explicitement invalides (absence de statut = OK). */
const BLOCKED_PLATFORM_STATUSES = new Set([
  "NOT_FOUND",
  "INVALID",
  "SEARCH_PAGE_ONLY",
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

/** @deprecated Utiliser BLOCKED_PLATFORM_STATUSES — conservé pour scripts. */
export const COMMANDER_ALLOWED_DELIVERY_STATUSES = new Set([
  "VALID_EXACT",
  "VALID_CHAIN_LOCATION_UNCLEAR",
]);

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

/** Racine ou locale seule (ex. `/`, `/fr`) — pas une fiche restaurant. */
export function isHomepageOnlyPath(pathname: string): boolean {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/") return true;
  const segments = normalizedPath.split("/").filter(Boolean);
  return (
    segments.length === 1 && /^[a-z]{2}(-[a-z]{2})?$/i.test(segments[0])
  );
}

/** URL de type placeholder (accueil plateforme sans restaurant). */
export function isPlaceholderOrderUrl(url: string | null | undefined): boolean {
  const u = parseHttpUrl(url);
  if (!u) return true;
  return isHomepageOnlyPath(u.pathname);
}

/**
 * Uber Eats exige en pratique `…/store/{slug}/{storeId}` pour les liens les plus fiables.
 * On accepte aussi les fiches `/store/{slug}` pour ne pas masquer des URLs partielles.
 */
export function uberEatsPathHasStoreId(pathname: string): boolean {
  const segs = pathname.split("/").filter(Boolean);
  const storeIdx = segs.findIndex((s) => s.toLowerCase() === "store");
  if (storeIdx < 0) return false;
  return segs.length > storeIdx + 2;
}

/** Statut plateforme : bloquer seulement les valeurs explicitement invalides. */
export function isPlatformLinkStatusAllowed(
  status: string | null | undefined
): boolean {
  if (status == null) return true;
  const s = String(status).trim();
  if (s === "") return true;
  return !BLOCKED_PLATFORM_STATUSES.has(s);
}

/**
 * URL Uber Eats utilisable : domaine Uber Eats, pas recherche ni accueil placeholder.
 */
export function isValidUberEatsUrl(url: string | null | undefined): boolean {
  if (isPlaceholderOrderUrl(url)) return false;
  const u = parseHttpUrl(url);
  if (!u) return false;
  const host = u.hostname.toLowerCase();
  if (!host.includes("ubereats.com") && !host.includes("uber.com")) return false;
  const path = u.pathname.toLowerCase();
  if (path.includes("/search")) return false;
  if (u.searchParams.has("q")) return false;
  if (path.includes("/store")) return true;
  return u.pathname.split("/").filter(Boolean).length >= 2;
}

/**
 * URL Deliveroo utilisable : domaine Deliveroo, pas recherche ni accueil placeholder.
 */
export function isValidDeliverooUrl(url: string | null | undefined): boolean {
  if (isPlaceholderOrderUrl(url)) return false;
  const u = parseHttpUrl(url);
  if (!u) return false;
  const host = u.hostname.toLowerCase();
  if (!host.includes("deliveroo")) return false;
  const path = u.pathname.toLowerCase();
  if (path.includes("/search")) return false;
  if (u.searchParams.has("query")) return false;
  if (path.includes("/menu")) return true;
  return u.pathname.split("/").filter(Boolean).length >= 2;
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

export function hasOrderPlatformLinks(
  restaurant: Pick<
    RestaurantListItem,
    | "uber_eats_url"
    | "uber_eats_status"
    | "deliveroo_url"
    | "deliveroo_status"
  >
): boolean {
  return (
    getValidatedUberEatsUrl(restaurant) != null ||
    getValidatedDeliverooUrl(restaurant) != null
  );
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
