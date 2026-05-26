import Link from "next/link";
import {
  discoverTotalPages,
  DISCOVER_PAGE_SIZE,
} from "@/lib/discover-constants";

type Props = {
  currentPage: number;
  totalCount: number;
};

/** Liens pagination crawlables (complète la carte interactive). */
export default function DiscoverSeoPagination({
  currentPage,
  totalCount,
}: Props) {
  const totalPages = discoverTotalPages(totalCount);
  if (totalPages <= 1) return null;

  const prev = currentPage > 1 ? currentPage - 1 : null;
  const next = currentPage < totalPages ? currentPage + 1 : null;

  return (
    <nav
      aria-label="Pagination des spots"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-[1000] focus:rounded-2xl focus:bg-white focus:p-4 focus:shadow-floating"
    >
      <p className="mb-2 text-sm text-ink">
        Page {currentPage} sur {totalPages} ({totalCount} spots,{" "}
        {DISCOVER_PAGE_SIZE} par page)
      </p>
      <ul className="flex flex-wrap gap-2 text-sm">
        {prev ? (
          <li>
            <Link href={prev === 1 ? "/discover" : `/discover?page=${prev}`}>
              Page précédente
            </Link>
          </li>
        ) : null}
        {next ? (
          <li>
            <Link href={`/discover?page=${next}`}>Page suivante</Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
