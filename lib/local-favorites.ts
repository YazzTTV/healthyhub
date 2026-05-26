/** Favoris anonymes — même clé que la carte Discover (sans compte). */
export const LOCAL_FAVORITES_STORAGE_KEY = "healthyhub:favorites";

export const LOCAL_FAVORITES_CHANGED_EVENT = "healthyhub-favorites-changed";

export function readFavoriteIdsFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_FAVORITES_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeFavoriteIdsToStorage(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode */
  }
}

export function notifyLocalFavoritesChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LOCAL_FAVORITES_CHANGED_EVENT));
}
