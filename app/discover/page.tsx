import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import type { RestaurantListItem } from "@/lib/types";
import FeedbackFAB from "@/components/FeedbackFAB";

export const revalidate = 60;

const RestaurantMap = dynamic(() => import("@/components/RestaurantMap"), {
  ssr: false,
});

async function getRestaurants(): Promise<{
  data: RestaurantListItem[];
  error: string | null;
}> {
  const hasEnv =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("[discover] env configured:", hasEnv);

  const baseColumns =
    "id, slug, name, image_url, city, cuisine, category, healthy_score, tags, latitude, longitude, rating, review_count, uber_eats_url, deliveroo_url";
  const extendedColumns = `${baseColumns}, protein_level, calorie_level, clean_level, recommended_for_weight_loss, recommended_for_muscle_gain, recommended_for_clean_eating`;
  const extendedWithMeta = `${extendedColumns}, created_at, service_type, opening_hours`;

  let data: RestaurantListItem[] | null = null;
  let error: string | null = null;

  const metaQuery = await supabase
    .from("restaurants")
    .select(extendedWithMeta)
    .order("healthy_score", { ascending: false, nullsFirst: false });
  data = (metaQuery.data ?? null) as RestaurantListItem[] | null;
  error = metaQuery.error?.message ?? null;

  if (error) {
    const primaryQuery = await supabase
      .from("restaurants")
      .select(extendedColumns)
      .order("healthy_score", { ascending: false, nullsFirst: false });
    data = (primaryQuery.data ?? null) as RestaurantListItem[] | null;
    error = primaryQuery.error?.message ?? null;
  }

  if (error?.includes("does not exist")) {
    const fallbackQuery = await supabase
      .from("restaurants")
      .select(baseColumns)
      .order("healthy_score", { ascending: false, nullsFirst: false });
    data = (fallbackQuery.data ?? null) as RestaurantListItem[] | null;
    error = fallbackQuery.error?.message ?? null;
  }

  if (error) {
    console.error("[discover] Supabase error:", error);
    return { data: [], error };
  }

  console.log(
    `[discover] fetched ${data?.length ?? 0} restaurant(s) from Supabase`
  );

  return { data: (data ?? []) as RestaurantListItem[], error: null };
}

export default async function DiscoverPage() {
  const { data: restaurants, error } = await getRestaurants();

  return (
    <div className="-mb-10 -mt-10 -mx-5 sm:-mx-6 md:-mx-8 lg:-mx-10">
      {error ? (
        <div className="mx-auto mt-10 max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          Impossible de charger les données pour le moment ({error}). La carte
          peut rester partielle le temps que tout revienne.
        </div>
      ) : null}

      {!error && restaurants.length === 0 ? (
        <div className="mx-auto mt-10 max-w-6xl rounded-3xl border border-dashed border-ink/15 p-12 text-center text-ink/50">
          Aucun spot à afficher pour l&apos;instant. Réessaie bientôt.
        </div>
      ) : null}

      <RestaurantMap restaurants={restaurants} />
      <FeedbackFAB />
    </div>
  );
}
