/** Nombre de spots par page Discover (SSR + Load more). */
export const DISCOVER_PAGE_SIZE = 12;

export function discoverPageFromParam(raw: string | undefined): number {
  const n = parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function discoverTotalPages(totalCount: number): number {
  return Math.max(1, Math.ceil(totalCount / DISCOVER_PAGE_SIZE));
}
