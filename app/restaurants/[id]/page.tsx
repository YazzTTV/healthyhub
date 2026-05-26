import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { supabase } from "@/lib/supabase";
import OrderActions from "@/components/OrderActions";
import RestaurantDetailActions from "@/components/RestaurantDetailActions";
import RestaurantNavigateCTA from "@/components/RestaurantNavigateCTA";
import type { Restaurant } from "@/lib/types";
import { getTrustedRestaurantImageForSharing } from "@/lib/restaurant-images";
import RestaurantImage from "@/components/RestaurantImage";
import VerifiedBadge from "@/components/VerifiedBadge";
import MacrosTeaser from "@/components/MacrosTeaser";
import ScoreExplainer from "@/components/ScoreExplainer";
import RestaurantViewTracker from "@/components/RestaurantViewTracker";
import SocialProof from "@/components/SocialProof";
import { isVerified } from "@/lib/restaurant-credibility";
import { getBestOrderLink } from "@/lib/order-links";
import {
  canShowCommanderForRestaurant,
  isDeliveryStatusCommanderAllowed,
} from "@/lib/order-delivery-status";
import { formatParisLocationLine } from "@/lib/restaurant-helpers";
import { displayHealthyScore } from "@/lib/healthy-score";
import { fetchRestaurantByIdOrSlug } from "@/lib/fetch-restaurant-detail";
import RestaurantShareButton from "@/components/RestaurantShareButton";

export const revalidate = 600;

const FALLBACK_DETAILS: Record<string, Restaurant> = {
  "fallback-1": {
    id: "fallback-1",
    slug: null,
    name: "Green Bowl Paris",
    description: "Bowls frais, options bio et sauces maison.",
    image_url: null,
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
    uber_eats_url: null,
    deliveroo_url: null,
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
    image_url: null,
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
    uber_eats_url: null,
    deliveroo_url: null,
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
    image_url: null,
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
    uber_eats_url: null,
    deliveroo_url: null,
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
    image_url: null,
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
    uber_eats_url: null,
    deliveroo_url: null,
    protein_level: "medium",
    calorie_level: "medium",
    clean_level: "high",
    recommended_for_weight_loss: true,
    recommended_for_muscle_gain: false,
    recommended_for_clean_eating: true,
    created_at: new Date().toISOString(),
  },
};

const loadRestaurantRemote = cache((idOrSlug: string) =>
  fetchRestaurantByIdOrSlug(supabase, idOrSlug)
);

async function getRestaurant(idOrSlug: string): Promise<Restaurant | null> {
  if (idOrSlug in FALLBACK_DETAILS) {
    return FALLBACK_DETAILS[idOrSlug];
  }
  const row = await loadRestaurantRemote(idOrSlug);
  return row as Restaurant | null;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const restaurant = await getRestaurant(params.id);
  if (!restaurant) {
    return { title: "Restaurant · HealthyHub" };
  }
  const title = `${restaurant.name} · HealthyHub`;
  const description = (
    restaurant.llm_summary?.trim() ||
    restaurant.description?.trim() ||
    "Spot healthy curé sur HealthyHub — Paris."
  ).slice(0, 200);

  const ogImage = getTrustedRestaurantImageForSharing(restaurant);

  return {
    title,
    description,
    openGraph: {
      title: restaurant.name,
      description,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: restaurant.name,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: restaurant.name,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function RestaurantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const restaurant = await getRestaurant(params.id);
  if (!restaurant) notFound();

  const orderLink = getBestOrderLink(restaurant);
  const showCommander = canShowCommanderForRestaurant(restaurant);
  const healthyDisplay = displayHealthyScore(restaurant);
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const shareUrl = siteBase
    ? `${siteBase}/restaurants/${restaurant.id}`
    : undefined;

  return (
    <article className="space-y-10 py-4 md:py-8">
      <RestaurantViewTracker
        id={restaurant.id}
        name={restaurant.name}
        slug={restaurant.slug}
        image_url={restaurant.image_url}
        image_status={restaurant.image_status}
        category={restaurant.category}
        arrondissement={restaurant.arrondissement}
        healthy_score={restaurant.healthy_score}
        city={restaurant.city}
      />
      <Link
        href="/discover"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-mute transition hover:text-brand"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Retour aux spots
      </Link>

      <header className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-14">
        <div className="aspect-[4/3] overflow-hidden rounded-[32px] bg-brand-light shadow-elevated ring-1 ring-ink/[0.06]">
          <RestaurantImage
            restaurant={restaurant}
            alt={restaurant.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col gap-7">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {restaurant.city ? (
                <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                  {restaurant.city}
                </span>
              ) : null}
              {restaurant.category ? (
                <span className="inline-flex items-center rounded-full bg-ink/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  {restaurant.category}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white">
                ● {healthyDisplay.toFixed(1)} healthy
              </span>
              {isVerified(restaurant) ? <VerifiedBadge size="md" /> : null}
            </div>
            <h1 className="text-[40px] font-semibold leading-[1.05] tracking-tighter-display text-ink md:text-[52px]">
              {restaurant.name}
            </h1>
            {restaurant.cuisine ? (
              <p className="text-[15px] text-ink-mute">{restaurant.cuisine}</p>
            ) : null}
            {formatParisLocationLine(restaurant) ? (
              <p className="text-[14px] leading-relaxed text-ink-soft">
                {formatParisLocationLine(restaurant)}
              </p>
            ) : null}
            {restaurant.google_maps_url ? (
              <p>
                <a
                  href={restaurant.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-brand-dark underline-offset-2 hover:underline"
                >
                  Voir sur Google Maps
                </a>
              </p>
            ) : null}
            <SocialProof restaurant={restaurant} />
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <RestaurantShareButton shareUrl={shareUrl} />
            </div>
          </div>

          {restaurant.description ? (
            <p className="text-[16.5px] leading-relaxed text-ink-soft">
              {restaurant.description}
            </p>
          ) : null}

          <ScoreExplainer restaurant={restaurant} />

          <MacrosTeaser
            restaurant={restaurant}
            dishName={restaurant.signature_dish_name ?? undefined}
          />

          {restaurant.tags && restaurant.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {restaurant.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-brand-light px-3 py-1 text-[12px] font-medium text-brand-deep"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <div className="space-y-4 border-t border-ink/[0.06] pt-6">
            <RestaurantDetailActions restaurantId={restaurant.id} />
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">
              Comment y manger
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end gap-3">
                <OrderActions restaurantId={restaurant.id} restaurant={restaurant} />
                <RestaurantNavigateCTA
                  restaurant={{
                    id: restaurant.id,
                    name: restaurant.name,
                    latitude: restaurant.latitude,
                    longitude: restaurant.longitude,
                  }}
                  source="restaurant_detail"
                  hasOrderLinks={canShowCommanderForRestaurant(restaurant)}
                  size="lg"
                  showDistance
                  className="flex flex-col"
                />
              </div>
              {!showCommander ? (
                <p className="text-[13px] text-ink-mute">
                  {orderLink &&
                  !isDeliveryStatusCommanderAllowed(restaurant.delivery_status)
                    ? "La commande via Uber Eats / Deliveroo n’est pas proposée tant que le statut livraison n’est pas validé (exact ou chaîne / lieu flou)."
                    : restaurant.uber_eats_url || restaurant.deliveroo_url
                      ? "Livraison non disponible pour ce spot pour le moment."
                      : "Pas de livraison sur ce spot — passe le voir sur place, ça vaut le détour."}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </article>
  );
}
