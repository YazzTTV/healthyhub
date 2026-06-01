import Link from "next/link";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import RestaurantDetailActions from "@/components/RestaurantDetailActions";
import type { Restaurant } from "@/lib/types";
import {
  getDistinctSignatureDishPhotoUrl,
  getTrustedRestaurantImageForSharing,
} from "@/lib/restaurant-images";
import RestaurantImage from "@/components/RestaurantImage";
import MacrosTeaser from "@/components/MacrosTeaser";
import ScoreExplainer from "@/components/ScoreExplainer";
import SocialProof from "@/components/SocialProof";
import VerifiedBadge from "@/components/VerifiedBadge";
import { canShowCommanderForRestaurant } from "@/lib/order-delivery-status";
import { isVerified } from "@/lib/restaurant-credibility";
import {
  getRestaurantConceptLabel,
  getSignatureDishDisplay,
} from "@/lib/signature-dish";
import { formatParisLocationLine } from "@/lib/restaurant-helpers";
import { displayHealthyScore } from "@/lib/healthy-score";
import { fetchRestaurantByIdOrSlug } from "@/lib/fetch-restaurant-detail";
import RestaurantShareButton from "@/components/RestaurantShareButton";

/** PostHog / analytics — chargés côté client uniquement (évite erreurs vendor-chunks en SSR). */
const RestaurantViewTracker = dynamic(
  () => import("@/components/RestaurantViewTracker"),
  { ssr: false }
);
const OrderActions = dynamic(() => import("@/components/OrderActions"), {
  ssr: false,
});
const RestaurantNavigateCTA = dynamic(
  () => import("@/components/RestaurantNavigateCTA"),
  { ssr: false }
);

export const revalidate = 600;

const loadRestaurantRemote = cache((idOrSlug: string) =>
  fetchRestaurantByIdOrSlug(createSupabaseServerClient(), idOrSlug)
);

async function getRestaurant(idOrSlug: string): Promise<Restaurant | null> {
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

  const showCommander = canShowCommanderForRestaurant(restaurant);
  const signatureDish = getSignatureDishDisplay(restaurant);
  const conceptLabel = signatureDish
    ? null
    : getRestaurantConceptLabel(restaurant);
  const distinctDishPhoto = getDistinctSignatureDishPhotoUrl(restaurant);
  const healthyDisplay = displayHealthyScore(restaurant);
  const verified = isVerified(restaurant);
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const shareUrl = siteBase
    ? `${siteBase}/restaurants/${restaurant.id}`
    : undefined;

  return (
    <article className="mx-auto w-full max-w-4xl space-y-10 py-4 md:py-8">
      <RestaurantViewTracker
        id={restaurant.id}
        name={restaurant.name}
        slug={restaurant.slug}
        image_url={restaurant.image_url}
        signature_dish_name={restaurant.signature_dish_name}
        signature_dish_image_url={restaurant.signature_dish_image_url}
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

      <header className="grid gap-8 md:grid-cols-2 md:items-start md:gap-10">
        <div className="relative aspect-[4/3] w-full max-w-full overflow-hidden rounded-[28px] bg-brand-light shadow-elevated ring-1 ring-ink/[0.06] md:rounded-[32px]">
          <RestaurantImage
            restaurant={restaurant}
            alt={restaurant.name}
            className="h-full w-full object-cover"
            dishName={signatureDish?.name ?? null}
            dishOverlayVariant="hero"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="eager"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
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
              {verified ? <VerifiedBadge size="md" /> : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white">
                ● {healthyDisplay.toFixed(1)} healthy
              </span>
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
        </div>

        <div className="flex w-full min-w-0 flex-col gap-7 md:col-span-2">
          <ScoreExplainer restaurant={restaurant} />

          {signatureDish ? (
            <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-ink/[0.06]">
              {distinctDishPhoto ? (
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-brand-light">
                  <RestaurantImage
                    restaurant={restaurant}
                    alt={signatureDish.name}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    dishName={signatureDish.name}
                    forceDishImage
                  />
                </div>
              ) : null}
              <div className="p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                  Plat phare
                </p>
                <p className="mt-1.5 text-[17px] font-semibold tracking-tight text-ink">
                  {signatureDish.name}
                </p>
                {signatureDish.description ? (
                  <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                    {signatureDish.description}
                  </p>
                ) : null}
              </div>
            </div>
          ) : conceptLabel ? (
            <div className="rounded-[20px] bg-brand-soft/50 p-4 ring-1 ring-brand/12 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                Ce qu&apos;on y mange
              </p>
              <p className="mt-1.5 text-[17px] font-semibold tracking-tight text-ink">
                {conceptLabel}
              </p>
              {restaurant.cuisine ? (
                <p className="mt-1.5 text-[14px] text-ink-soft">{restaurant.cuisine}</p>
              ) : null}
            </div>
          ) : null}

          <MacrosTeaser
            restaurant={restaurant}
            dishName={signatureDish?.name}
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
                  Pas de livraison en ligne pour ce spot — passe le voir sur place,
                  ça vaut le détour.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    </article>
  );
}
