import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import type { RestaurantListItem } from "@/lib/types";

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

  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id, slug, name, image_url, city, cuisine, category, healthy_score, tags, latitude, longitude, uber_eats_url, deliveroo_url"
    )
    .order("healthy_score", { ascending: false, nullsFirst: false });

  if (error) {
    console.error("[discover] Supabase error:", error.message);
    return { data: [], error: error.message };
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
          Donnees live indisponibles pour le moment ({error}). Affichage d'une
          selection locale de restaurants.
        </div>
      ) : null}

      {!error && restaurants.length === 0 ? (
        <div className="mx-auto mt-10 max-w-6xl rounded-3xl border border-dashed border-ink/15 p-12 text-center text-ink/50">
          Aucun restaurant trouvé.
        </div>
      ) : null}

      <RestaurantMap restaurants={restaurants} />
    </div>
  );
}
