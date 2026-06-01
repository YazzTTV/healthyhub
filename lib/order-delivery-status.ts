import {
  getBestOrderLink,
  hasOrderPlatformLinks,
} from "@/lib/order-links";

export { COMMANDER_ALLOWED_DELIVERY_STATUSES } from "@/lib/order-links";

/**
 * @deprecated Ne plus filtrer sur delivery_status — les liens plateforme suffisent.
 */
export function isDeliveryStatusCommanderAllowed(
  _status: string | null | undefined
): boolean {
  return true;
}

/** Au moins un lien Uber Eats ou Deliveroo valide (hors placeholders). */
export function canShowCommanderForRestaurant(
  r: Parameters<typeof getBestOrderLink>[0]
): boolean {
  return hasOrderPlatformLinks(r);
}
