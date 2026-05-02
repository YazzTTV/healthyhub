"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import type { RestaurantListItem } from "@/lib/types";
import { displayHealthyScore } from "@/lib/healthy-score";
import {
  getIntentReason,
  getIntentTag,
  getRecommendedDishForIntent,
  getRestaurantIntentScore,
  INTENT_MODES,
  type IntentMode,
} from "@/lib/intent";
import RestaurantImage from "@/components/RestaurantImage";
import { calculateDistanceKm } from "@/lib/geo";
import RestaurantNavigateCTA from "@/components/RestaurantNavigateCTA";

// Paris center — fallback when user geolocation is denied / unavailable
const PARIS: [number, number] = [48.8566, 2.3522];

// Branded SVG pin. Uses Tailwind-ish inline styles so it renders everywhere.
function makePin(selected = false, highlighted = false) {
  const color = selected ? "#1f4a36" : "#2f6d4e";
  const ring = highlighted ? "0 0 0 4px rgba(47,109,78,0.22)" : "none";
  const html = `
    <div style="
      width: 34px; height: 34px;
      border-radius: 999px;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18), ${ring};
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; color: white;
    ">🌿</div>`;
  return L.divIcon({
    className: "healthyhub-pin",
    html,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

function meIcon() {
  const html = `
    <div style="
      width: 18px; height: 18px;
      border-radius: 999px;
      background: #2f6d4e;
      border: 3px solid white;
      box-shadow: 0 0 0 4px rgba(47,109,78,0.28);
    "></div>`;
  return L.divIcon({
    className: "healthyhub-me",
    html,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Helper: recenter map whenever the target coord changes
function Recenter({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 0.8 });
  }, [center, map]);
  return null;
}

function Rating({ rating, count }: { rating: number | null; count: number | null }) {
  if (rating == null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-ink">
      <span aria-hidden>★</span>
      {rating.toFixed(1)}
      {count ? (
        <span className="text-xs font-normal text-ink/50">({count})</span>
      ) : null}
    </span>
  );
}

export default function DiscoverMap({
  restaurants,
}: {
  restaurants: RestaurantListItem[];
}) {
  const [activeCategory, setActiveCategory] = useState<string>("Toutes");
  const [activeIntent, setActiveIntent] = useState<IntentMode | null>(null);
  const [intentExpanded, setIntentExpanded] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);

  // Ask for geolocation on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(p);
        setFlyTo(p);
      },
      () => {
        // Silent fallback — Paris center
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.category && set.add(r.category));
    return ["Toutes", ...Array.from(set).sort()];
  }, [restaurants]);

  const visible = useMemo(() => {
    if (activeCategory === "Toutes") return restaurants;
    return restaurants.filter((r) => r.category === activeCategory);
  }, [activeCategory, restaurants]);

  const withIntent = useMemo(() => {
    const enriched = visible.map((restaurant) => {
      const intentScore = activeIntent
        ? getRestaurantIntentScore(restaurant, activeIntent)
        : displayHealthyScore(restaurant) * 10;
      return { restaurant, intentScore };
    });

    return enriched.sort((a, b) => b.intentScore - a.intentScore);
  }, [visible, activeIntent]);

  const topRankedIds = useMemo(
    () => withIntent.slice(0, 3).map((item) => item.restaurant.id),
    [withIntent]
  );

  const fallbackMessage =
    activeIntent &&
    withIntent.length > 0 &&
    withIntent.slice(0, Math.min(6, withIntent.length)).every(
      (entry) => entry.intentScore < 70
    );

  const selectedIntentMeta = activeIntent
    ? INTENT_MODES.find((mode) => mode.id === activeIntent) ?? null
    : null;

  const mappable = withIntent
    .map((entry) => entry.restaurant)
    .filter((r) => r.latitude != null && r.longitude != null);

  const distanceKmNumber = (restaurant: RestaurantListItem) => {
    if (!userPos || restaurant.latitude == null || restaurant.longitude == null) {
      return null;
    }
    return calculateDistanceKm(userPos, [
      Number(restaurant.latitude),
      Number(restaurant.longitude),
    ]);
  };

  const kmDistance = (restaurant: RestaurantListItem) => {
    const km = distanceKmNumber(restaurant);
    if (km == null) return null;
    return km.toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white/95 p-4 shadow-sm ring-1 ring-ink/10 sm:p-5">
        {intentExpanded || !selectedIntentMeta ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Quel resultat tu veux apres ce repas ?
              </h2>
              <p className="mt-1 text-sm text-ink/65">
                Focus, sport, leger ou clean : HealthyHub t&apos;aide a choisir le
                bon resto et le bon plat.
              </p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {INTENT_MODES.map((intent) => {
                const active = activeIntent === intent.id;
                return (
                  <button
                    key={intent.id}
                    onClick={() => {
                      setActiveIntent(intent.id);
                      setIntentExpanded(false);
                    }}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-brand bg-brand-light/70 shadow-sm"
                        : "border-ink/10 bg-white hover:border-brand/40 hover:bg-brand-light/40"
                    }`}
                  >
                    <p className="text-sm font-semibold text-ink">
                      {intent.icon} {intent.label}
                    </p>
                    <p className="mt-1 text-xs text-ink/65">{intent.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1.5 text-sm font-medium text-brand-dark">
              Objectif : {selectedIntentMeta.label}
            </span>
            <button
              onClick={() => setIntentExpanded(true)}
              className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-brand ring-1 ring-brand/25 transition hover:bg-brand-light/50"
            >
              Changer
            </button>
          </div>
        )}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const active = cat === activeCategory;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-ink/70 ring-1 ring-ink/10 hover:bg-brand-light hover:text-brand-dark"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Split layout: cards + map */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1.4fr]">
        {/* Cards list */}
        <div className="order-2 space-y-4 lg:order-1 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:pr-1">
          {withIntent.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink/15 p-10 text-center text-ink/50">
              Aucun restaurant dans cette catégorie.
            </div>
          ) : (
            <>
              {fallbackMessage ? (
                <div className="rounded-2xl bg-brand-light/70 p-4 text-sm text-brand-dark ring-1 ring-brand/15">
                  On te montre les meilleures options proches de ton objectif.
                </div>
              ) : null}
              {withIntent.map(({ restaurant: r }) => (
                <article
                  key={r.id}
                  onMouseEnter={() => setSelectedId(r.id)}
                  onClick={() => {
                    setSelectedId(r.id);
                    if (r.latitude != null && r.longitude != null) {
                      setFlyTo([Number(r.latitude), Number(r.longitude)]);
                    }
                  }}
                  className={`group flex cursor-pointer gap-4 rounded-2xl bg-white p-3 ring-1 transition hover:shadow-md ${
                    selectedId === r.id
                      ? "ring-brand/50 shadow-md"
                      : "ring-ink/5"
                  }`}
                >
                  <div className="relative h-28 w-28 flex-none overflow-hidden rounded-xl bg-brand-light">
                    <RestaurantImage
                      restaurant={r}
                      alt={r.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-semibold text-ink">
                        {r.name}
                      </h3>
                      <Rating rating={r.rating} count={r.review_count} />
                    </div>
                    <p className="truncate text-sm text-ink/60">
                      {[r.category, r.city].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-ink/55">
                      Score healthy :{" "}
                      <span className="font-semibold text-ink">
                        {displayHealthyScore(r).toFixed(1)}
                      </span>
                      {kmDistance(r) ? ` · ${kmDistance(r)} km` : ""}
                    </p>

                    {activeIntent ? (
                      <div className="mt-1 space-y-1.5">
                        <span className="inline-flex w-fit items-center rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-semibold text-brand-dark">
                          {getIntentTag(activeIntent)}
                        </span>
                        <p className="text-xs text-ink">
                          <span className="font-semibold">Plat conseille :</span>{" "}
                          {getRecommendedDishForIntent(r, activeIntent)}
                        </p>
                        <p className="text-xs text-ink/70">
                          <span className="font-semibold text-ink">Pourquoi :</span>{" "}
                          {getIntentReason(r, activeIntent)}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-1 space-y-1 text-xs text-ink/70">
                        <p>
                          <span className="font-semibold text-ink">Plat phare :</span>{" "}
                          Bowl equilibre maison
                        </p>
                        <p>Recommendation generale selon score healthy et categorie.</p>
                      </div>
                    )}

                    <div className="mt-auto flex flex-wrap items-stretch gap-2 pt-2">
                      <button
                        type="button"
                        aria-label={`Ajouter ${r.name} en favori`}
                        className="rounded-full bg-white px-2.5 py-1 text-sm ring-1 ring-ink/15 transition hover:bg-brand-light"
                      >
                        ♡
                      </button>
                      {r.uber_eats_url || r.deliveroo_url ? (
                        <a
                          href={r.uber_eats_url || r.deliveroo_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex min-h-[40px] min-w-[100px] flex-1 items-center justify-center rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark"
                        >
                          Commander
                        </a>
                      ) : null}
                      <RestaurantNavigateCTA
                        restaurant={r}
                        source="discover_list"
                        hasOrderLinks={Boolean(
                          r.uber_eats_url || r.deliveroo_url
                        )}
                        size="md"
                        distanceKm={distanceKmNumber(r)}
                        showDistance
                        className="min-w-[100px] flex-1 flex-col"
                        buttonClassName="w-full"
                      />
                      <Link
                        href={`/restaurants/${r.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </>
          )}
        </div>

        {/* Map */}
        <div className="order-1 h-[60vh] overflow-hidden rounded-3xl ring-1 ring-ink/5 lg:sticky lg:top-24 lg:order-2 lg:h-[calc(100vh-14rem)]">
          <MapContainer
            center={userPos ?? PARIS}
            zoom={13}
            scrollWheelZoom
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{y}/{x}.png"
            />

            <Recenter center={flyTo} />

            {userPos ? (
              <Marker position={userPos} icon={meIcon()}>
                <Popup>Vous êtes ici</Popup>
              </Marker>
            ) : null}

            {mappable.map((r) => (
              <Marker
                key={r.id}
                position={[Number(r.latitude), Number(r.longitude)]}
                icon={makePin(selectedId === r.id, topRankedIds.includes(r.id))}
                eventHandlers={{
                  click: () => setSelectedId(r.id),
                }}
              >
                <Popup>
                  <div className="min-w-[200px] space-y-2">
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-ink/60">
                      {[r.category, r.city].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-ink/70">
                      Score healthy : {displayHealthyScore(r).toFixed(1)}
                    </p>
                    {r.rating != null ? (
                      <p className="text-xs">
                        ★ {r.rating.toFixed(1)}
                        {r.review_count
                          ? ` (${r.review_count} avis)`
                          : ""}
                      </p>
                    ) : null}
                    {activeIntent ? (
                      <>
                        <p className="pt-1 text-xs font-semibold text-brand-dark">
                          {getIntentTag(activeIntent)}
                        </p>
                        <p className="text-xs">
                          <span className="font-semibold">Plat conseille :</span>{" "}
                          {getRecommendedDishForIntent(r, activeIntent)}
                        </p>
                        <p className="text-xs text-ink/70">
                          {getIntentReason(r, activeIntent)}
                        </p>
                      </>
                    ) : null}
                    <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-2">
                      {r.uber_eats_url || r.deliveroo_url ? (
                        <a
                          href={r.uber_eats_url || r.deliveroo_url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-[36px] min-w-[100px] flex-1 items-center justify-center rounded-full bg-brand px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-dark"
                        >
                          Commander
                        </a>
                      ) : null}
                      <RestaurantNavigateCTA
                        restaurant={r}
                        source="discover_map_popup"
                        hasOrderLinks={Boolean(
                          r.uber_eats_url || r.deliveroo_url
                        )}
                        size="sm"
                        distanceKm={distanceKmNumber(r)}
                        showDistance
                        className="min-w-[100px] flex-1 flex-col"
                        buttonClassName="w-full"
                      />
                      <Link
                        href={`/restaurants/${r.id}`}
                        className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-full bg-white px-3 text-xs font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
