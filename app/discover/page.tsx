import { Suspense } from "react";
import { fetchDiscoverMapPins } from "@/lib/fetch-discover-map-pins";
import { fetchRestaurantListRows } from "@/lib/fetch-restaurant-list";
import {
  discoverPageFromParam,
  DISCOVER_PAGE_SIZE,
} from "@/lib/discover-constants";
import dynamic from "next/dynamic";
import type { RestaurantListItem } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import FeedbackFAB from "@/components/FeedbackFAB";
import DiscoverPageSkeleton from "@/components/discover/DiscoverPageSkeleton";
import DiscoverSeoPagination from "@/components/discover/DiscoverSeoPagination";

export const revalidate = 600;

const RestaurantMap = dynamic(() => import("@/components/RestaurantMap"), {
  ssr: false,
  loading: () => <DiscoverPageSkeleton />,
});

type PageProps = {
  searchParams?: { page?: string };
};

async function getDiscoverPageData(page: number): Promise<{
  restaurants: RestaurantListItem[];
  totalCount: number;
  error: string | null;
}> {
  const offset = (page - 1) * DISCOVER_PAGE_SIZE;
  const { data, error, totalCount } = await fetchRestaurantListRows(supabase, {
    limit: DISCOVER_PAGE_SIZE,
    offset,
    withCount: true,
  });

  return {
    restaurants: data,
    totalCount: totalCount ?? data.length,
    error,
  };
}

async function DiscoverContent({ page }: { page: number }) {
  const [{ data: mapPins, error: pinsError }, pageData] = await Promise.all([
    fetchDiscoverMapPins(supabase),
    getDiscoverPageData(page),
  ]);

  const error = pinsError ?? pageData.error;

  return (
    <>
      <DiscoverSeoPagination
        currentPage={page}
        totalCount={pageData.totalCount}
      />
      {error ? (
        <div className="mx-auto mt-10 max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Impossible de charger les données pour le moment ({error}). La carte
          peut rester partielle le temps que tout revienne.
        </div>
      ) : null}

      {!error && pageData.restaurants.length === 0 ? (
        <div className="mx-auto mt-10 max-w-6xl rounded-3xl border border-dashed border-ink/15 p-12 text-center text-ink/50">
          Aucun spot à afficher pour l&apos;instant. Réessaie bientôt.
        </div>
      ) : null}

      <RestaurantMap
        mapPins={mapPins}
        initialPageRestaurants={pageData.restaurants}
        initialPage={page}
        totalCount={pageData.totalCount}
      />
      <FeedbackFAB />
    </>
  );
}

export default function DiscoverPage({ searchParams }: PageProps) {
  const page = discoverPageFromParam(searchParams?.page);

  return (
    <Suspense fallback={<DiscoverPageSkeleton />}>
      <DiscoverContent page={page} />
    </Suspense>
  );
}
