import type { RestaurantListItem } from "@/lib/types";

/**
 * Source unique de vérité image: Supabase (`image_url`, `signature_dish_image_url`, …).
 */

export type RestaurantImageStatus =
  | "VERIFIED_EXACT"
  | "VERIFIED_BRAND"
  | "PLATFORM_IMAGE"
  | "PREMIUM_FALLBACK"
  | "MISSING";

export type RestaurantImageSource = Pick<
  RestaurantListItem,
  | "id"
  | "name"
  | "slug"
  | "category"
  | "image_url"
  | "image_status"
  | "signature_dish_image_url"
  | "signature_dish_name"
> &
  Partial<
    Pick<
      RestaurantListItem,
      "cover_image_url" | "image_source_note" | "image_source_url"
    >
  >;

export type TrustImageTone = "verified" | "brand" | "indicative";

export type TrustImageBadge = {
  label: string;
  tone: TrustImageTone;
};

/**
 * Ce que l'image représente — utilisé pour l'overlay nom du plat.
 */
export type ImageContext = "dish" | "restaurant" | "brand" | "category";

export type TrustedRestaurantImage = {
  mode: "image" | "placeholder";
  src: string | null;
  imageContext: ImageContext | null;
  /** Usage interne / admin uniquement — ne pas afficher à l'utilisateur. */
  trustBadge: TrustImageBadge | null;
};

const NON_CREDIBLE_FRAGMENTS = [
  "via.placeholder",
  "placeholder",
  "picsum.photos",
];

/** Visuels synthétiques Manus (texte intégré) — jamais affichés comme photo food. */
const SYNTHETIC_PLACEHOLDER_HOSTS = ["files.manuscdn.com"];

export function isSyntheticPlaceholderImageUrl(
  url: string | null | undefined
): boolean {
  const trimmed = url?.trim();
  if (!trimmed) return false;
  try {
    const host = new URL(trimmed).hostname.toLowerCase();
    return SYNTHETIC_PLACEHOLDER_HOSTS.some(
      (h) => host === h || host.endsWith(`.${h}`)
    );
  } catch {
    return false;
  }
}

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
  if (upper === "FALLBACK_GENERIC") return "PREMIUM_FALLBACK";
  if (upper === "GOOGLE_MAPS_IMAGE") return "PLATFORM_IMAGE";
  const known = new Set<RestaurantImageStatus>([
    "VERIFIED_EXACT",
    "VERIFIED_BRAND",
    "PLATFORM_IMAGE",
    "PREMIUM_FALLBACK",
    "MISSING",
  ]);
  return known.has(upper as RestaurantImageStatus)
    ? (upper as RestaurantImageStatus)
    : null;
}

export function resolveHttpsImageUrl(
  url: string | null | undefined
): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !isCredibleRestaurantImageUrl(trimmed)) return null;
  return trimmed;
}

function resolveDisplayImageUrl(
  url: string | null | undefined
): string | null {
  const resolved = resolveHttpsImageUrl(url);
  if (resolved) return resolved;
  const trimmed = url?.trim();
  if (trimmed && /^https:\/\//i.test(trimmed)) return trimmed;
  return null;
}

/** URL https affichable, hors visuels synthétiques type manuscdn. */
export function resolveUsableImageUrl(
  url: string | null | undefined
): string | null {
  const resolved = resolveDisplayImageUrl(url);
  if (!resolved) return null;
  if (isSyntheticPlaceholderImageUrl(resolved)) return null;
  return resolved;
}

function trustBadgeFromImageStatus(
  status: RestaurantImageStatus | null
): TrustImageBadge | null {
  switch (status) {
    case "VERIFIED_EXACT":
      return { label: "Photo vérifiée", tone: "verified" };
    case "VERIFIED_BRAND":
      return { label: "Image de marque", tone: "brand" };
    case "PLATFORM_IMAGE":
      return { label: "Image partenaire", tone: "indicative" };
    case "PREMIUM_FALLBACK":
      return { label: "Image indicative", tone: "indicative" };
    default:
      return null;
  }
}

function imageContextFromStatus(
  status: RestaurantImageStatus | null
): ImageContext {
  switch (status) {
    case "VERIFIED_EXACT":
    case "PLATFORM_IMAGE":
      return "restaurant";
    case "VERIFIED_BRAND":
      return "brand";
    case "PREMIUM_FALLBACK":
      return "category";
    default:
      return "restaurant";
  }
}

function hasSignatureDishLabel(
  r: Pick<RestaurantImageSource, "signature_dish_name">
): boolean {
  return Boolean(r.signature_dish_name?.trim());
}

/** URL affichable pour le plat phare (colonne dédiée, ou `image_url` si nom de plat en base). */
export function resolveSignatureDishImageUrl(
  r: Pick<
    RestaurantImageSource,
    "signature_dish_image_url" | "image_url" | "signature_dish_name"
  >
): string | null {
  const fromColumn = resolveUsableImageUrl(r.signature_dish_image_url);
  if (fromColumn) return fromColumn;
  if (hasSignatureDishLabel(r)) {
    return resolveUsableImageUrl(r.image_url);
  }
  return null;
}

export function hasRestaurantImageUrl(
  r: Pick<
    RestaurantImageSource,
    | "image_url"
    | "image_status"
    | "signature_dish_image_url"
    | "signature_dish_name"
  >
): boolean {
  return (
    resolveUsableImageUrl(r.image_url) != null ||
    resolveUsableImageUrl(r.signature_dish_image_url) != null
  );
}

type DisplayPick = {
  src: string;
  imageContext: ImageContext;
  trustBadge: TrustImageBadge | null;
};

function pickRestaurantDisplay(r: RestaurantImageSource): DisplayPick | null {
  const status = normalizeRestaurantImageStatus(r.image_status);
  const dishLabel = hasSignatureDishLabel(r);

  // `image_url` enrichi en base (Manus) prime sur d’anciens `signature_dish_image_url`.
  const main = resolveUsableImageUrl(r.image_url);
  if (main) {
    return {
      src: main,
      imageContext: dishLabel ? "dish" : imageContextFromStatus(status),
      trustBadge: null,
    };
  }

  const signature = resolveUsableImageUrl(r.signature_dish_image_url);
  if (signature) {
    return { src: signature, imageContext: "dish", trustBadge: null };
  }

  const cover = resolveUsableImageUrl(r.cover_image_url);
  if (cover) {
    return {
      src: cover,
      imageContext: dishLabel ? "dish" : imageContextFromStatus(status),
      trustBadge: trustBadgeFromImageStatus(status),
    };
  }

  return null;
}

export function getRestaurantImage(
  r: RestaurantImageSource
): TrustedRestaurantImage {
  const pick = pickRestaurantDisplay(r);

  if (pick) {
    return {
      mode: "image",
      src: pick.src,
      imageContext: pick.imageContext,
      trustBadge: pick.trustBadge,
    };
  }
  return { mode: "placeholder", src: null, imageContext: null, trustBadge: null };
}

/**
 * Photo plat pour la carte « Plat phare » — uniquement si différente de l’image hero,
 * pour éviter le doublon visuel sur la fiche restaurant.
 */
export function getDistinctSignatureDishPhotoUrl(
  r: RestaurantImageSource
): string | null {
  const dishUrl = resolveSignatureDishImageUrl(r);
  if (!dishUrl) return null;
  const hero = getRestaurantImage(r);
  if (hero.mode === "image" && hero.src === dishUrl) return null;
  return dishUrl;
}

/** Section « Plat phare » : photo plat dédiée ou `image_url` si nom de plat en base. */
export function getRestaurantDishImage(
  r: RestaurantImageSource
): TrustedRestaurantImage {
  const dishUrl = resolveSignatureDishImageUrl(r);
  if (dishUrl) {
    return {
      mode: "image",
      src: dishUrl,
      imageContext: "dish",
      trustBadge: null,
    };
  }
  return { mode: "placeholder", src: null, imageContext: null, trustBadge: null };
}

export function getRestaurantImageForSharing(
  r: RestaurantImageSource
): string | undefined {
  const { mode, src } = getRestaurantImage(r);
  return mode === "image" && src ? src : undefined;
}

export function hasDisplayableRestaurantImage(
  r: RestaurantImageSource
): boolean {
  return getRestaurantImage(r).mode === "image";
}

export const getTrustedRestaurantImage = getRestaurantImage;
export const getTrustedRestaurantImageForSharing = getRestaurantImageForSharing;
