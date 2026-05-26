import {
  COMMANDER_ALLOWED_DELIVERY_STATUSES,
  getBestOrderLink,
} from "@/lib/order-links";

export { COMMANDER_ALLOWED_DELIVERY_STATUSES };

/**
 * `true` si le statut permet d’afficher le bouton Commander (liens Uber/Deliveroo).
 * Absence de valeur en base → `true` (rétrocompatibilité avant la colonne).
 */
export function isDeliveryStatusCommanderAllowed(
  status: string | null | undefined
): boolean {
  if (status == null) return true;
  const s = String(status).trim();
  if (s === "") return true;
  return COMMANDER_ALLOWED_DELIVERY_STATUSES.has(s);
}

export function canShowCommanderForRestaurant(
  r: Parameters<typeof getBestOrderLink>[0] & {
    delivery_status?: string | null;
  }
): boolean {
  if (getBestOrderLink(r) == null) return false;
  return isDeliveryStatusCommanderAllowed(r.delivery_status);
}
