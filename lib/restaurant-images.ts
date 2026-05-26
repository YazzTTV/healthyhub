import type { RestaurantListItem } from "@/lib/types";

/**
 * Images restaurant : uniquement URLs sourcées (image_status Supabase).
 * Plus de fallback Unsplash / catégorie aléatoire.
 */

export type RestaurantImageStatus =
  | "VERIFIED_EXACT"
  | "VERIFIED_BRAND"
  | "PLATFORM_IMAGE"
  | "GOOGLE_MAPS_IMAGE"
  | "FALLBACK_GENERIC"
  | "MISSING";

export type RestaurantImageSource = Pick<
  RestaurantListItem,
  | "id"
  | "name"
  | "slug"
  | "image_url"
  | "image_status"
  | "image_source_note"
  | "image_source_url"
>;

export type TrustedRestaurantImageTone =
  | "verified"
  | "brand"
  | "indicative"
  | null;

export type TrustedRestaurantImage = {
  mode: "image" | "placeholder";
  src: string | null;
  badgeLabel: string | null;
  badgeTone: TrustedRestaurantImageTone;
};

const TRUSTED_STATUSES: readonly RestaurantImageStatus[] = [
  "VERIFIED_EXACT",
  "VERIFIED_BRAND",
  "PLATFORM_IMAGE",
  "GOOGLE_MAPS_IMAGE",
];

const NON_CREDIBLE_FRAGMENTS = [
  "photo-1512621776951-a57141f2eefd",
  "via.placeholder",
  "placeholder",
  "picsum.photos",
];

export function isCredibleRestaurantImageUrl(
  url: string | null | undefined
): boolean {
  if (url == null || typeof url !== "string") return false;
  const t = url.trim();
  if (!/^https:\/\//i.test(t)) return false;
  if (t.length < 28) return false;
  const lower = t.toLowerCase();
  return !NON_CREDIBLE_FRAGMENTS.some((frag) => lower.includes(frag));
}

export function normalizeRestaurantImageStatus(
  status: string | null | undefined
): RestaurantImageStatus | null {
  if (status == null || typeof status !== "string") return null;
  const upper = status.trim().toUpperCase();
  const known: RestaurantImageStatus[] = [
    "VERIFIED_EXACT",
    "VERIFIED_BRAND",
    "PLATFORM_IMAGE",
    "GOOGLE_MAPS_IMAGE",
    "FALLBACK_GENERIC",
    "MISSING",
  ];
  return known.includes(upper as RestaurantImageStatus)
    ? (upper as RestaurantImageStatus)
    : null;
}

function resolveImageUrl(r: RestaurantImageSource): string | null {
  const url = r.image_url?.trim();
  if (!url || !isCredibleRestaurantImageUrl(url)) return null;
  return url;
}

function trustBadgeForStatus(
  status: RestaurantImageStatus
): Pick<TrustedRestaurantImage, "badgeLabel" | "badgeTone"> {
  switch (status) {
    case "VERIFIED_EXACT":
      return { badgeLabel: "Photo vérifiée", badgeTone: "verified" };
    case "VERIFIED_BRAND":
      return { badgeLabel: "Image de marque", badgeTone: "brand" };
    case "FALLBACK_GENERIC":
      return { badgeLabel: "Image indicative", badgeTone: "indicative" };
    default:
      return { badgeLabel: null, badgeTone: null };
  }
}

/**
 * Détermine quelle image afficher (ou placeholder neutre) selon image_status.
 */
export function getTrustedRestaurantImage(
  r: RestaurantImageSource
): TrustedRestaurantImage {
  const status = normalizeRestaurantImageStatus(r.image_status);
  const url = resolveImageUrl(r);

  if (status === "FALLBACK_GENERIC" && url) {
    return {
      mode: "image",
      src: url,
      ...trustBadgeForStatus(status),
    };
  }

  if (
    status &&
    TRUSTED_STATUSES.includes(status) &&
    url
  ) {
    return {
      mode: "image",
      src: url,
      ...trustBadgeForStatus(status),
    };
  }

  if (status === "MISSING" || !url) {
    if (!status && url) {
      return {
        mode: "image",
        src: url,
        badgeLabel: null,
        badgeTone: null,
      };
    }
    return {
      mode: "placeholder",
      src: null,
      badgeLabel: null,
      badgeTone: null,
    };
  }

  return {
    mode: "placeholder",
    src: null,
    badgeLabel: null,
    badgeTone: null,
  };
}

/** URL affichable pour OG / partage — uniquement si statut de confiance. */
export function getTrustedRestaurantImageForSharing(
  r: RestaurantImageSource
): string | undefined {
  const trusted = getTrustedRestaurantImage(r);
  if (trusted.mode !== "image" || !trusted.src) return undefined;
  const status = normalizeRestaurantImageStatus(r.image_status);
  if (status === "FALLBACK_GENERIC") return undefined;
  if (!status) return trusted.src;
  if (status === "MISSING") return undefined;
  return trusted.src;
}

export function hasDisplayableRestaurantImage(r: RestaurantImageSource): boolean {
  return getTrustedRestaurantImage(r).mode === "image";
}
