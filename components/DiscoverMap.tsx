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

// Paris center — fallback when user geolocation is denied / unavailable
const PARIS: [number, number] = [48.8566, 2.3522];

// Branded SVG pin. Uses Tailwind-ish inline styles so it renders everywhere.
function makePin(selected = false) {
  const color = selected ? "#1f4a36" : "#2f6d4e";
  const html = `
    <div style="
      width: 34px; height: 34px;
      border-radius: 999px;
      background: ${color};
      border: 3px solid white;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
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
      background: #2563eb;
      border: 3px solid white;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.25);
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

  const mappable = visible.filter(
    (r) => r.latitude != null && r.longitude != null
  );

  return (
    <div className="space-y-6">
      {/* Filter chips */}
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
          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-ink/15 p-10 text-center text-ink/50">
              Aucun restaurant dans cette catégorie.
            </div>
          ) : (
            visible.map((r) => (
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
                  {r.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.image_url}
                      alt={r.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">
                      🥗
                    </div>
                  )}
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
                  {r.tags && r.tags.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-medium text-brand-dark"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <Link
                    href={`/restaurants/${r.id}`}
                    className="mt-auto self-start text-sm font-semibold text-brand hover:text-brand-dark"
                  >
                    Découvrir & commander →
                  </Link>
                </div>
              </article>
            ))
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
                icon={makePin(selectedId === r.id)}
                eventHandlers={{
                  click: () => setSelectedId(r.id),
                }}
              >
                <Popup>
                  <div className="min-w-[180px] space-y-1">
                    <p className="font-semibold">{r.name}</p>
                    <p className="text-xs text-ink/60">
                      {[r.category, r.city].filter(Boolean).join(" · ")}
                    </p>
                    {r.rating != null ? (
                      <p className="text-xs">
                        ★ {r.rating.toFixed(1)}
                        {r.review_count
                          ? ` (${r.review_count} avis)`
                          : ""}
                      </p>
                    ) : null}
                    <Link
                      href={`/restaurants/${r.id}`}
                      className="inline-block pt-1 text-xs font-semibold text-brand hover:text-brand-dark"
                    >
                      Voir la fiche →
                    </Link>
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
