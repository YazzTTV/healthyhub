import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import OrderActions from "@/components/OrderActions";
import type { Restaurant } from "@/lib/types";

export const revalidate = 60;

const FALLBACK_DETAILS: Record<string, Restaurant> = {
  "fallback-1": {
    id: "fallback-1",
    slug: null,
    name: "Green Bowl Paris",
    description: "Bowls frais, options bio et sauces maison.",
    image_url:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop",
    city: "Paris",
    cuisine: "Healthy",
    category: "Salad",
    healthy_score: 9.1,
    tags: ["bio", "frais"],
    latitude: 48.8615,
    longitude: 2.3348,
    rating: null,
    review_count: null,
    website_url: null,
    uber_eats_url: "https://www.ubereats.com/fr",
    deliveroo_url: "https://deliveroo.fr",
    protein_level: "medium",
    calorie_level: "low",
    clean_level: "high",
    recommended_for_weight_loss: true,
    recommended_for_muscle_gain: false,
    recommended_for_clean_eating: true,
    created_at: new Date().toISOString(),
  },
  "fallback-2": {
    id: "fallback-2",
    slug: null,
    name: "Protein Club",
    description: "Menus riches en proteines et legumes de saison.",
    image_url:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&auto=format&fit=crop",
    city: "Paris",
    cuisine: "Healthy",
    category: "Protein",
    healthy_score: 8.7,
    tags: ["high-protein"],
    latitude: 48.8708,
    longitude: 2.3078,
    rating: null,
    review_count: null,
    website_url: null,
    uber_eats_url: "https://www.ubereats.com/fr",
    deliveroo_url: "https://deliveroo.fr",
    protein_level: "high",
    calorie_level: "medium",
    clean_level: "high",
    recommended_for_weight_loss: false,
    recommended_for_muscle_gain: true,
    recommended_for_clean_eating: true,
    created_at: new Date().toISOString(),
  },
  "fallback-3": {
    id: "fallback-3",
    slug: null,
    name: "Poke Atelier",
    description: "Poke bowls healthy avec poissons et alternatives veggie.",
    image_url:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200&auto=format&fit=crop",
    city: "Paris",
    cuisine: "Healthy",
    category: "Poke",
    healthy_score: 8.4,
    tags: ["omega-3"],
    latitude: 48.8532,
    longitude: 2.3499,
    rating: null,
    review_count: null,
    website_url: null,
    uber_eats_url: "https://www.ubereats.com/fr",
    deliveroo_url: "https://deliveroo.fr",
    protein_level: "high",
    calorie_level: "medium",
    clean_level: "high",
    recommended_for_weight_loss: true,
    recommended_for_muscle_gain: true,
    recommended_for_clean_eating: true,
    created_at: new Date().toISOString(),
  },
  "fallback-4": {
    id: "fallback-4",
    slug: null,
    name: "Vegan Corner",
    description: "Plats vegan gourmands et ingredients non transformes.",
    image_url:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1200&auto=format&fit=crop",
    city: "Paris",
    cuisine: "Healthy",
    category: "Vegan",
    healthy_score: 9.4,
    tags: ["vegan"],
    latitude: 48.8768,
    longitude: 2.3559,
    rating: null,
    review_count: null,
    website_url: null,
    uber_eats_url: "https://www.ubereats.com/fr",
    deliveroo_url: "https://deliveroo.fr",
    protein_level: "medium",
    calorie_level: "medium",
    clean_level: "high",
    recommended_for_weight_loss: true,
    recommended_for_muscle_gain: false,
    recommended_for_clean_eating: true,
    created_at: new Date().toISOString(),
  },
};

async function getRestaurant(id: string): Promise<Restaurant | null> {
  if (id in FALLBACK_DETAILS) {
    return FALLBACK_DETAILS[id];
  }

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[restaurant] Failed to load:", error.message);
    return null;
  }
  return data as Restaurant;
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const restaurant = await getRestaurant(params.id);
  if (!restaurant) notFound();

  const { uber_eats_url, deliveroo_url } = restaurant;

  return (
    <article className="space-y-10">
      <Link
        href="/discover"
        className="inline-flex items-center gap-1 text-sm text-ink/60 hover:text-brand"
      >
        ← Retour aux restaurants
      </Link>

      <header className="grid gap-10 md:grid-cols-2">
        <div className="aspect-[4/3] overflow-hidden rounded-4xl bg-brand-light">
          {restaurant.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.image_url}
              alt={restaurant.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl">
              🥗
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            {restaurant.city ? (
              <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
                {restaurant.city}
              </span>
            ) : null}
            <h1 className="text-4xl font-bold tracking-tight text-ink md:text-5xl">
              {restaurant.name}
            </h1>
            {restaurant.cuisine ? (
              <p className="text-ink/60">{restaurant.cuisine}</p>
            ) : null}
          </div>

          {restaurant.description ? (
            <p className="text-lg leading-relaxed text-ink/80">
              {restaurant.description}
            </p>
          ) : null}

          {restaurant.tags && restaurant.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {restaurant.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand-dark"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <div className="space-y-3 pt-4">
            <p className="text-sm font-semibold text-ink/70">Commander sur :</p>
            <div>
              <OrderActions
                restaurantId={restaurant.id}
                uberEatsUrl={uber_eats_url}
                deliverooUrl={deliveroo_url}
              />
              {!uber_eats_url && !deliveroo_url ? (
                <p className="text-sm text-ink/50">
                  Livraison non disponible pour le moment.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </article>
  );
}
