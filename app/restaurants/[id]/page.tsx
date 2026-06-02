import Link from "next/link";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Restaurant } from "@/lib/types";
import {
  getRestaurantGalleryImageUrls,
  getTrustedRestaurantImageForSharing,
} from "@/lib/restaurant-images";
import RestaurantImage from "@/components/RestaurantImage";
import { displayHealthyScore } from "@/lib/healthy-score";
import { fetchRestaurantByIdOrSlug } from "@/lib/fetch-restaurant-detail";
import { getDisplayRating, getDisplayReviewCount } from "@/lib/restaurant-helpers";
import {
  getDecisionChips,
  getMenuExpectationChips,
  getNutritionDots,
  getNutritionProfile,
  getRecommendedOption,
  getRestaurantConcept,
  getScoreExplanation,
  getValidDeliveryLinks,
} from "@/lib/restaurant-detail";

/** PostHog / analytics — chargés côté client uniquement (évite erreurs vendor-chunks en SSR). */
const RestaurantViewTracker = dynamic(
  () => import("@/components/RestaurantViewTracker"),
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

  const healthyDisplay = displayHealthyScore(restaurant).toFixed(1);
  const rating = getDisplayRating(restaurant);
  const reviewCount = getDisplayReviewCount(restaurant);
  const decisionChips = getDecisionChips(restaurant);
  const concept = getRestaurantConcept(restaurant);
  const expectationChips = getMenuExpectationChips(restaurant);
  const nutrition = getNutritionProfile(restaurant);
  const recommendedOption = getRecommendedOption(restaurant);
  const scoreExplanation = getScoreExplanation(restaurant);
  const links = getValidDeliveryLinks(restaurant);
  const websiteUrl = restaurant.website_url?.trim() || null;
  const mapsUrl = restaurant.google_maps_url?.trim() || null;
  const orderUrl = links.uberEatsUrl ?? links.deliverooUrl;
  const locationLine = [restaurant.arrondissement, restaurant.full_address]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(" · ");
  const openingHours = formatOpeningHours(restaurant.opening_hours);
  const heroPitch = restaurant.description?.trim() || concept;
  const whyGoItems = buildWhyGoItems({
    decisionChips: decisionChips,
    arrondissement: restaurant.arrondissement,
    takeaway: restaurant.takeaway_possible === true,
    delivery: restaurant.delivery_possible === true,
    dineIn: restaurant.dine_in_possible === true,
  });
  const nutritionRows: Array<{ label: string; value: "faible" | "moyen" | "eleve" }> = [
    { label: "Proteines", value: nutrition.protein },
    { label: "Calories", value: nutrition.calories },
    { label: "Clean level", value: nutrition.clean },
  ].filter((x): x is { label: string; value: "faible" | "moyen" | "eleve" } => x.value != null);
  const serviceExpectation = getServiceExpectationChips(restaurant);
  const galleryImages = getRestaurantGalleryImageUrls(restaurant);

  return (
    <article className="mx-auto w-full max-w-5xl space-y-6 px-4 py-4 md:space-y-8 md:py-8">
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

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ink/[0.06]">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-light">
            <RestaurantImage
              restaurant={restaurant}
              alt={restaurant.name}
              className="h-full w-full object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="eager"
            />
          </div>
          <div className="flex flex-col gap-4 p-5 md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {restaurant.category ? (
                <span className="rounded-full bg-brand-light px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                  {restaurant.category}
                </span>
              ) : null}
              {restaurant.cuisine ? (
                <span className="rounded-full bg-ink/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                  {restaurant.cuisine}
                </span>
              ) : null}
              <span className="rounded-full bg-brand px-3 py-1 text-[11px] font-semibold text-white">
                {healthyDisplay} healthy
              </span>
            </div>
            <h1 className="text-[34px] font-semibold leading-[1.05] tracking-tighter-display text-ink md:text-[42px]">
              {restaurant.name}
            </h1>
            {locationLine ? (
              <p className="text-[14px] leading-relaxed text-ink-soft">{locationLine}</p>
            ) : null}
            {rating != null ? (
              <p className="text-[14px] text-ink-soft">
                Note Google : <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
                {reviewCount ? ` (${reviewCount} avis)` : ""}
              </p>
            ) : null}
            <div className="rounded-xl bg-brand-soft/50 p-3 ring-1 ring-brand/12">
              <p className="text-[12px] font-semibold text-brand-deep">
                Pourquoi {healthyDisplay} ?
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
                {scoreExplanation}
              </p>
            </div>
            <p className="text-[14px] leading-relaxed text-ink-soft">{heroPitch}</p>

            <div className="mt-1 flex flex-wrap gap-2">
              {mapsUrl ? (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] items-center rounded-full bg-brand px-4 text-[13px] font-semibold text-white transition hover:bg-brand-dark"
                >
                  S&apos;y rendre
                </a>
              ) : null}
              {orderUrl ? (
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] items-center rounded-full bg-white px-4 text-[13px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/40"
                >
                  Commander
                </a>
              ) : null}
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] items-center rounded-full bg-white px-4 text-[13px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/40"
                >
                  Site web
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {galleryImages.length > 0 ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06]">
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">
            Le lieu en images
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {galleryImages.map((src, idx) => (
              <div
                key={src}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-brand-light"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${restaurant.name} - vue ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {whyGoItems.length > 0 ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06]">
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">
            Pourquoi y aller
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {whyGoItems.map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-brand-soft px-3 py-1.5 text-[12px] font-semibold text-brand-deep ring-1 ring-brand/15"
              >
                {chip}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06]">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">Le concept</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{concept}</p>
      </section>

      {expectationChips.length > 0 || serviceExpectation.length > 0 ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06]">
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">
            Ce que tu peux y trouver
          </h2>
          {expectationChips.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {expectationChips.map((chip) => (
                <span
                  key={chip.label}
                  className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-ink ring-1 ring-ink/10"
                >
                  {chip.icon} {chip.label}
                </span>
              ))}
            </div>
          ) : null}
          {serviceExpectation.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {serviceExpectation.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-ink ring-1 ring-ink/10"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06]">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">
          Option recommandee
        </h2>
        {recommendedOption.hasSignatureDish ? (
          <div className="mt-3 space-y-2">
            <p className="text-[16px] font-semibold text-ink">{recommendedOption.name}</p>
            {recommendedOption.description ? (
              <p className="text-[14px] leading-relaxed text-ink-soft">
                {recommendedOption.description}
              </p>
            ) : null}
            {recommendedOption.macros ? (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="kcal" value={`${recommendedOption.macros.calories}`} />
                <Metric label="proteines" value={`${recommendedOption.macros.protein}g`} />
                <Metric label="glucides" value={`${recommendedOption.macros.carbs}g`} />
                <Metric label="lipides" value={`${recommendedOption.macros.fats}g`} />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-[16px] font-semibold text-ink">
              {recommendedOption.fallbackTitle}
            </p>
            <p className="text-[14px] text-ink-soft">
              {recommendedOption.fallbackDescription}
            </p>
            {recommendedOption.highlights.length > 0 ? (
              <ul className="space-y-1.5">
                {recommendedOption.highlights.map((line) => (
                  <li key={line} className="text-[13px] text-ink-soft">
                    • {line}
                  </li>
                ))}
              </ul>
            ) : null}
            {orderUrl ? (
              <a
                href={orderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[40px] items-center rounded-full bg-white px-4 text-[13px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/40"
              >
                Voir le menu
              </a>
            ) : null}
          </div>
        )}
      </section>

      {nutritionRows.length > 0 ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06]">
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">
            Profil nutritionnel
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {nutritionRows.map((row) => (
              <NutritionLine
                key={row.label}
                label={row.label}
                value={row.value}
                dots={getNutritionDots(row.value)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink/[0.06]">
        <h2 className="text-[18px] font-semibold tracking-tight text-ink">
          Infos pratiques
        </h2>
        <dl className="mt-3 space-y-2 text-[14px] text-ink-soft">
          {restaurant.full_address ? (
            <div>
              <dt className="font-semibold text-ink">Adresse</dt>
              <dd>{restaurant.full_address}</dd>
            </div>
          ) : null}
          {restaurant.arrondissement ? (
            <div>
              <dt className="font-semibold text-ink">Arrondissement</dt>
              <dd>{restaurant.arrondissement}</dd>
            </div>
          ) : null}
          <div>
            <dt className="font-semibold text-ink">Services</dt>
            <dd className="flex flex-wrap gap-2 pt-1">
              <ServicePill active={restaurant.dine_in_possible === true} label="Sur place" />
              <ServicePill active={restaurant.takeaway_possible === true} label="A emporter" />
              <ServicePill active={restaurant.delivery_possible === true} label="Livraison" />
            </dd>
          </div>
          {openingHours ? (
            <div>
              <dt className="font-semibold text-ink">Horaires</dt>
              <dd>{openingHours}</dd>
            </div>
          ) : null}
          {(websiteUrl || mapsUrl || links.uberEatsUrl || links.deliverooUrl) ? (
            <div>
              <dt className="font-semibold text-ink">Liens</dt>
              <dd className="flex flex-wrap gap-2 pt-1">
                {websiteUrl ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink ring-1 ring-ink/10"
                  >
                    Site web
                  </a>
                ) : null}
                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink ring-1 ring-ink/10"
                  >
                    Google Maps
                  </a>
                ) : null}
                {links.uberEatsUrl ? (
                  <a
                    href={links.uberEatsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink ring-1 ring-ink/10"
                  >
                    Uber Eats
                  </a>
                ) : null}
                {links.deliverooUrl ? (
                  <a
                    href={links.deliverooUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-ink ring-1 ring-ink/10"
                  >
                    Deliveroo
                  </a>
                ) : null}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-soft/60 px-3 py-2 ring-1 ring-brand/15">
      <p className="text-[14px] font-semibold text-ink">{value}</p>
      <p className="text-[10px] uppercase tracking-[0.1em] text-ink-mute">{label}</p>
    </div>
  );
}

function NutritionLine({
  label,
  value,
  dots,
}: {
  label: string;
  value: "faible" | "moyen" | "eleve";
  dots: number;
}) {
  return (
    <div className="rounded-xl bg-brand-soft/50 px-3 py-2 ring-1 ring-brand/12">
      <p className="text-[11px] uppercase tracking-[0.1em] text-ink-mute">{label}</p>
      <p className="mt-1 text-[15px] font-semibold text-ink">{renderDots(dots)}</p>
      <p className="text-[12px] text-ink-soft">{value}</p>
    </div>
  );
}

function ServicePill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
        active
          ? "bg-brand-light text-brand-deep ring-1 ring-brand/20"
          : "bg-ink/[0.04] text-ink/55 ring-1 ring-ink/[0.08]"
      }`}
    >
      {label}
    </span>
  );
}

function formatOpeningHours(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  if (Array.isArray(raw)) {
    const lines = raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
    return lines.length ? lines.join(" · ") : null;
  }
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const lines = Object.entries(obj)
      .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
      .map(([day, value]) => `${day}: ${String(value)}`);
    return lines.length ? lines.join(" · ") : null;
  }
  return null;
}

function buildWhyGoItems({
  decisionChips,
  arrondissement,
  takeaway,
  delivery,
  dineIn,
}: {
  decisionChips: Array<{ label: string; icon?: string }>;
  arrondissement: string | null | undefined;
  takeaway: boolean;
  delivery: boolean;
  dineIn: boolean;
}) {
  const items = decisionChips.map((c) => `${c.icon ? `${c.icon} ` : ""}${c.label}`);
  if (arrondissement?.trim()) items.push(`📍 Bien situe : ${arrondissement.trim()}`);
  if (takeaway) items.push("🥡 Parfait pour emporter");
  if (delivery) items.push("🛵 Commande facile en livraison");
  if (dineIn) items.push("🍽️ Bon choix sur place");
  return Array.from(new Set(items)).slice(0, 6);
}

function getServiceExpectationChips(restaurant: Restaurant) {
  const chips: string[] = [];
  if (restaurant.takeaway_possible === true) chips.push("🥡 A emporter");
  if (restaurant.delivery_possible === true) chips.push("🛵 Livraison");
  if (restaurant.dine_in_possible === true) chips.push("🍽️ Sur place");
  if (restaurant.cuisine?.trim()) chips.push(`🍴 ${restaurant.cuisine.trim()}`);
  return chips;
}

function renderDots(level: number) {
  const safe = Math.max(0, Math.min(5, level));
  return `${"●".repeat(safe)}${"○".repeat(5 - safe)}`;
}
