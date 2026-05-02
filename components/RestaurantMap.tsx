"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { trackEvent } from "@/lib/analytics";
import type { RestaurantListItem } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  addFavorite,
  getCurrentUser,
  getUserFavorites,
  removeFavorite,
  trackUserHistory,
} from "@/lib/user-data";
import {
  getOpeningHoursShortLabel,
  getServiceAvailabilityChips,
} from "@/lib/restaurant-presentation";
import DiscoverBestChoiceCard from "@/components/DiscoverBestChoiceCard";
import DiscoverWeekStrip from "@/components/DiscoverWeekStrip";
import MacrosTeaser from "@/components/MacrosTeaser";
import RestaurantImage from "@/components/RestaurantImage";
import { displayHealthyScore } from "@/lib/healthy-score";
import {
  getIntentReason,
  getRecommendedDishForIntent,
  getIntentTag,
  type IntentMode,
} from "@/lib/intent";
import {
  buildWeekSpotlights,
  getBestChoice,
  getPrimaryActionUrl,
  rankRestaurantsForIntent,
} from "@/lib/discover-recommendations";
import { calculateDistanceKm } from "@/lib/geo";
import RestaurantNavigateCTA from "@/components/RestaurantNavigateCTA";

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];
const FILTERS = [
  "Tous",
  "Poke",
  "Salade",
  "Vegan",
  "Protein",
  "Brunch",
  "Coups de cœur",
] as const;
const SORT_OPTIONS = ["Plus proches", "Mieux notés", "Score healthy"] as const;
const GOALS = ["Perte de poids", "Prise de muscle", "Manger clean"] as const;
const FAVORITES_KEY = "healthyhub:favorites";
type Goal = (typeof GOALS)[number];
type NutritionLevel = "low" | "medium" | "high";

type RestaurantProfile = {
  protein_level: NutritionLevel;
  calorie_level: NutritionLevel;
  clean_level: NutritionLevel;
  recommended_for_weight_loss: boolean;
  recommended_for_muscle_gain: boolean;
  recommended_for_clean_eating: boolean;
};

function mapGoalToIntent(goal: Goal): IntentMode {
  if (goal === "Perte de poids") return "LEAN_LIGHT";
  if (goal === "Prise de muscle") return "MUSCLE_RECOVERY";
  return "CLEAN_RESET";
}

function inferRestaurantProfile(restaurant: RestaurantListItem): RestaurantProfile {
  const normalizedCategory = (restaurant.category ?? "").toLowerCase();
  const normalizedCuisine = (restaurant.cuisine ?? "").toLowerCase();
  const healthyScore = displayHealthyScore(restaurant);

  const hasProtein =
    normalizedCategory.includes("protein") ||
    normalizedCuisine.includes("protein") ||
    normalizedCuisine.includes("burger");
  const hasPoke = normalizedCategory.includes("poke") || normalizedCuisine.includes("poke");
  const hasSalad =
    normalizedCategory.includes("salad") ||
    normalizedCategory.includes("salade") ||
    normalizedCuisine.includes("salad");
  const hasVegan =
    normalizedCategory.includes("vegan") || normalizedCuisine.includes("vegan");
  const hasBrunch =
    normalizedCategory.includes("brunch") || normalizedCuisine.includes("brunch");

  const protein_level: NutritionLevel = hasProtein
    ? "high"
    : hasPoke || hasVegan
      ? "medium"
      : hasSalad
        ? "low"
        : hasBrunch
          ? "medium"
          : "medium";

  const calorie_level: NutritionLevel = hasSalad
    ? "low"
    : hasBrunch
      ? "high"
      : hasProtein || hasPoke || hasVegan
        ? "medium"
        : "medium";

  const clean_level: NutritionLevel =
    healthyScore >= 4.5 || hasSalad || hasVegan || hasPoke
      ? "high"
      : healthyScore >= 3.5
        ? "medium"
        : "low";

  return {
    protein_level: restaurant.protein_level ?? protein_level,
    calorie_level: restaurant.calorie_level ?? calorie_level,
    clean_level: restaurant.clean_level ?? clean_level,
    recommended_for_weight_loss:
      restaurant.recommended_for_weight_loss ??
      ((calorie_level === "low" || calorie_level === "medium") &&
        clean_level === "high" &&
        healthyScore >= 4),
    recommended_for_muscle_gain:
      restaurant.recommended_for_muscle_gain ??
      (protein_level === "high" && healthyScore >= 3),
    recommended_for_clean_eating:
      restaurant.recommended_for_clean_eating ??
      (clean_level === "high" && healthyScore >= 4),
  };
}

function rankRestaurantForGoal(
  restaurant: RestaurantListItem,
  goal: Goal,
  distanceKm: number | null
) {
  const profile = inferRestaurantProfile(restaurant);
  const healthyScore = displayHealthyScore(restaurant);
  let score = healthyScore * 10;

  if (distanceKm != null) {
    score += Math.max(0, 15 - distanceKm);
  }

  const category = (restaurant.category ?? "").toLowerCase();

  if (goal === "Perte de poids") {
    score += profile.calorie_level === "low" ? 30 : profile.calorie_level === "medium" ? 15 : -10;
    score += profile.clean_level === "high" ? 30 : profile.clean_level === "medium" ? 10 : -15;
    score += profile.recommended_for_weight_loss ? 25 : -20;
    score += healthyScore >= 4 ? 20 : -30;
    if (category.includes("salad") || category.includes("salade")) score += 15;
    if (category.includes("vegan")) score += 10;
    if (category.includes("poke")) score += 8;
  } else if (goal === "Prise de muscle") {
    score += profile.protein_level === "high" ? 35 : profile.protein_level === "medium" ? 10 : -20;
    score += profile.calorie_level === "high" || profile.calorie_level === "medium" ? 10 : -10;
    score += profile.recommended_for_muscle_gain ? 25 : -15;
    score += healthyScore >= 3 ? 15 : -20;
    if (category.includes("protein")) score += 18;
    if (category.includes("poke")) score += 10;
  } else {
    score += profile.clean_level === "high" ? 35 : profile.clean_level === "medium" ? 8 : -25;
    score += profile.recommended_for_clean_eating ? 25 : -15;
    score += healthyScore >= 4 ? 20 : -20;
    if (
      category.includes("poke") ||
      category.includes("salad") ||
      category.includes("salade") ||
      category.includes("vegan") ||
      category.includes("protein") ||
      category.includes("brunch")
    ) {
      score += 10;
    }
  }

  return score;
}

function getGoalFilteredRestaurants(
  goal: Goal,
  restaurants: RestaurantListItem[],
  getDistance: (restaurant: RestaurantListItem) => number | null
) {
  const scored = restaurants.map((restaurant) => ({
    restaurant,
    profile: inferRestaurantProfile(restaurant),
    score: rankRestaurantForGoal(restaurant, goal, getDistance(restaurant)),
  }));

  const strict = scored.filter(({ restaurant, profile }) => {
    const healthyScore = displayHealthyScore(restaurant);
    if (goal === "Perte de poids") {
      return (
        (profile.calorie_level === "low" || profile.calorie_level === "medium") &&
        profile.clean_level === "high" &&
        healthyScore >= 4 &&
        profile.recommended_for_weight_loss
      );
    }
    if (goal === "Prise de muscle") {
      return (
        profile.protein_level === "high" &&
        healthyScore >= 3 &&
        profile.recommended_for_muscle_gain
      );
    }
    return (
      profile.clean_level === "high" &&
      healthyScore >= 4 &&
      profile.recommended_for_clean_eating
    );
  });

  const pool =
    strict.length >= 4
      ? strict
      : [...scored]
          .sort((a, b) => b.score - a.score)
          .slice(0, Math.min(20, Math.max(scored.length, 8)));

  return pool.sort((a, b) => b.score - a.score).map(({ restaurant }) => restaurant);
}

// Premium SVG pin marker — a teardrop with a leaf
function createRestaurantMarkerIcon(
  restaurant: RestaurantListItem,
  isSelected: boolean
) {
  const score = displayHealthyScore(restaurant);
  const fill = score >= 4.5 ? "#1f4a36" : score >= 3.5 ? "#2f6d4e" : "#4f8a6b";
  const size = isSelected ? 44 : 36;
  const ring = isSelected
    ? '<circle cx="22" cy="22" r="20" fill="rgba(47,109,78,0.18)"/>'
    : "";
  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <svg viewBox="0 0 44 44" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        ${ring}
        <circle cx="22" cy="22" r="14" fill="white" stroke="${fill}" stroke-width="${isSelected ? 2.5 : 1.5}"/>
        <path d="M22 14c2.4 0 4 1.6 4 3.6 0 1.4-1 2.4-2.4 2.4-1 0-1.6-.4-2.6-.4S19 20 18 20c-1.4 0-2.4-1-2.4-2.4 0-2 1.6-3.6 4-3.6 .8 0 1.4.2 2.4.4z" fill="${fill}" opacity="0.18"/>
        <path d="M19 22c0-2 1.4-3.6 3-3.6s3 1.6 3 3.6-1.4 3.6-3 3.6S19 24 19 22z" fill="${fill}"/>
        <path d="M22 28v-2" stroke="${fill}" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </div>`;
  return L.divIcon({
    className: "healthyhub-marker",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const userIcon = L.divIcon({
  className: "healthyhub-user-marker",
  html: `<div style="width:14px;height:14px;background:#2f6d4e;border:2px solid white;border-radius:999px;box-shadow:0 0 0 5px rgba(47,109,78,.28);"></div>`,
  iconAnchor: [7, 7],
});

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom() < 13 ? 13 : map.getZoom(), { duration: 0.6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
}

// === Small UI primitives ===
function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold tracking-tight transition duration-250 ease-out-expo ${
        active
          ? "bg-ink text-white shadow-soft"
          : "bg-white text-ink/70 ring-1 ring-ink/[0.08] hover:text-ink hover:ring-ink/20"
      }`}
    >
      {children}
    </button>
  );
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold text-brand-deep">
      <span aria-hidden>●</span>
      {score.toFixed(1)} healthy
    </span>
  );
}

function RatingMini({
  rating,
  count,
}: {
  rating: number | null;
  count: number | null;
}) {
  if (rating == null) return null;
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-ink/5 px-2 py-0.5 text-[10.5px] font-semibold text-ink/75">
      <span aria-hidden>★</span>
      {rating.toFixed(1)}
      {count != null && count > 0 ? (
        <span className="font-medium text-ink/45">({count})</span>
      ) : null}
    </span>
  );
}

function ServiceAndHoursRow({ restaurant }: { restaurant: RestaurantListItem }) {
  const chips = getServiceAvailabilityChips(restaurant);
  const hours = getOpeningHoursShortLabel(restaurant);
  return (
    <div className="mt-1.5 space-y-1">
      {chips.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {chips.map((c) => (
            <span
              key={c.label}
              className="rounded-full border border-brand/20 bg-brand-light/80 px-2 py-0.5 text-[10px] font-semibold text-brand-deep"
            >
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
      <p className="text-[10px] text-ink/50">{hours}</p>
    </div>
  );
}

function HeartButton({
  active,
  onClick,
  className = "",
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-soft ring-1 ring-ink/[0.06] transition duration-250 ease-out-expo hover:scale-105 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[18px] w-[18px]"
        fill={active ? "#e0345b" : "none"}
        stroke={active ? "#e0345b" : "currentColor"}
        strokeWidth={1.8}
      >
        <path d="M12 21s-7-4.35-7-10a4.5 4.5 0 0 1 8-2.85A4.5 4.5 0 0 1 19 11c0 5.65-7 10-7 10z" />
      </svg>
    </button>
  );
}

// === Main component ===
export default function RestaurantMap({
  restaurants,
}: {
  restaurants: RestaurantListItem[];
}) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("Tous");
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>("Score healthy");
  const [activeGoal, setActiveGoal] = useState<(typeof GOALS)[number] | null>(null);
  const [showGoalPanel, setShowGoalPanel] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(PARIS_CENTER);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const currentUser = await getCurrentUser();
      if (!mounted) return;
      setUser(currentUser);
      if (currentUser) {
        const rows = await getUserFavorites(currentUser.id);
        if (!mounted) return;
        setFavorites(rows.map((row) => row.restaurant_id));
      } else {
        try {
          const raw = localStorage.getItem(FAVORITES_KEY);
          const parsed = raw ? (JSON.parse(raw) as string[]) : [];
          setFavorites(parsed);
        } catch {
          setFavorites([]);
        }
      }
      setHydrated(true);
    };
    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        const raw = localStorage.getItem(FAVORITES_KEY);
        const parsed = raw ? (JSON.parse(raw) as string[]) : [];
        setFavorites(parsed);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    void trackEvent({ event_name: "discover_page_loaded" });
  }, []);

  const updateFilter = (filter: (typeof FILTERS)[number]) => {
    setActiveFilter(filter);
    void trackEvent({
      event_name: "used_category_filter",
      metadata: { filter },
    });
  };

  const getRestaurantDistance = (restaurant: RestaurantListItem) => {
    if (!userPosition || restaurant.latitude == null || restaurant.longitude == null) {
      return null;
    }
    return calculateDistanceKm(userPosition, [
      restaurant.latitude,
      restaurant.longitude,
    ]);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Géolocalisation indisponible sur ce navigateur.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        setUserPosition(coords);
        setMapCenter(coords);
        setLocationMessage(
          "Position détectée — on met en avant les spots les plus proches."
        );
      },
      () => {
        setUserPosition(null);
        setMapCenter(PARIS_CENTER);
        setLocationMessage(
          "Localisation inactive — carte centrée sur Paris en attendant."
        );
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const toggleFavorite = async (restaurantId: string) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    setFavorites((previous) => {
      const exists = previous.includes(restaurantId);
      const next = exists
        ? previous.filter((id) => id !== restaurantId)
        : [...previous, restaurantId];
      void trackEvent({
        event_name: "clicked_favorite",
        restaurant_id: restaurantId,
        metadata: { action: exists ? "removed" : "added" },
      });
      void (async () => {
        if (exists) await removeFavorite(user.id, restaurantId);
        else await addFavorite(user.id, restaurantId);
      })();
      return next;
    });
  };

  const intentModeForRanking = useMemo<IntentMode>(
    () => (activeGoal ? mapGoalToIntent(activeGoal) : "CLEAN_RESET"),
    [activeGoal]
  );

  const baseFiltered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = restaurants.filter((restaurant) => {
      const matchesFilter =
        activeFilter === "Tous" ||
        (activeFilter === "Coups de cœur" && favorites.includes(restaurant.id)) ||
        (restaurant.category ?? "")
          .toLowerCase()
          .includes(activeFilter.toLowerCase().replace("salade", "salad"));
      if (!matchesFilter) return false;

      if (!term) return true;
      return [restaurant.name, restaurant.category, restaurant.city]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });

    if (activeGoal) {
      result = getGoalFilteredRestaurants(activeGoal, result, getRestaurantDistance);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, activeGoal, favorites, restaurants, search, userPosition]);

  const filtered = useMemo(() => {
    const list = [...baseFiltered];
    if (sortBy === "Score healthy") {
      return rankRestaurantsForIntent(list, intentModeForRanking, userPosition);
    }
    if (sortBy === "Mieux notés") {
      return list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    if (!userPosition) {
      return list.sort((a, b) => displayHealthyScore(b) - displayHealthyScore(a));
    }
    return list.sort((a, b) => {
      const distA = getRestaurantDistance(a);
      const distB = getRestaurantDistance(b);
      if (distA == null) return 1;
      if (distB == null) return -1;
      return distA - distB;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseFiltered, intentModeForRanking, sortBy, userPosition]);

  const bestChoiceRestaurant = useMemo(
    () => getBestChoice(baseFiltered, intentModeForRanking, userPosition),
    [baseFiltered, intentModeForRanking, userPosition]
  );

  const weekSpotlights = useMemo(
    () => buildWeekSpotlights(restaurants),
    [restaurants]
  );

  const listForPanels = useMemo(() => {
    if (!bestChoiceRestaurant) return filtered;
    return filtered.filter((r) => r.id !== bestChoiceRestaurant.id);
  }, [filtered, bestChoiceRestaurant]);

  const mappableRestaurants = useMemo(
    () =>
      filtered.filter(
        (restaurant) => restaurant.latitude != null && restaurant.longitude != null
      ),
    [filtered]
  );

  const recommendationText = useMemo(() => {
    if (activeGoal === "Perte de poids")
      return "On met en avant des spots légers et équilibrés pour ton objectif.";
    if (activeGoal === "Prise de muscle")
      return "On privilégie les adresses riches en protéines autour de toi.";
    if (activeGoal === "Manger clean")
      return "On classe les lieux les plus clean selon ton périmètre.";
    return null;
  }, [activeGoal]);

  const getHighlightedDish = (restaurant: RestaurantListItem) => {
    const intent: IntentMode = activeGoal
      ? mapGoalToIntent(activeGoal)
      : "CLEAN_RESET";
    return getRecommendedDishForIntent(restaurant, intent);
  };

  const whyOneLine = (restaurant: RestaurantListItem) =>
    getIntentReason(
      restaurant,
      activeGoal ? mapGoalToIntent(activeGoal) : "CLEAN_RESET"
    );

  if (!hydrated) {
    return (
      <section className="relative h-[calc(100vh-4rem)] min-h-[680px] w-full overflow-hidden bg-cream">
        <div className="mx-auto max-w-6xl p-6">
          <div className="h-20 animate-pulse rounded-2xl bg-white/70" />
          <div className="mt-4 h-[65vh] animate-pulse rounded-3xl bg-white/60" />
        </div>
      </section>
    );
  }

  return (
    <section className="discover-ux relative h-[calc(100vh-4rem)] min-h-[680px] w-full overflow-hidden bg-cream-deep">
      {/* === Top control bar === */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1200] px-3 pt-3 sm:px-4 sm:pt-4">
        <div className="pointer-events-auto mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-[26px] bg-white/95 shadow-floating ring-1 ring-ink/[0.06] backdrop-blur-xl supports-[backdrop-filter]:bg-white/85">
            {/* Header row */}
            <div className="flex items-start gap-3 border-b border-ink/[0.05] px-4 pb-3 pt-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-deep/80">
                  Découverte locale · healthy
                </p>
                <h1 className="mt-0.5 text-[17px] font-semibold tracking-tight-display text-ink">
                  <span className="block truncate">
                    {filtered.length} spots healthy
                    {activeFilter !== "Tous" ? ` · ${activeFilter}` : " près de toi"}
                  </span>
                </h1>
                <p className="mt-1 text-[11px] leading-snug text-ink/55">
                  Selon ta localisation, tes objectifs et les restaurants les mieux notés.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLocate}
                aria-label="Me localiser"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/70 transition hover:bg-brand-light hover:text-brand-dark"
              >
                <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setShowGoalPanel((v) => !v)}
                className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold transition sm:gap-1.5 sm:px-3.5 sm:text-[12.5px] ${
                  activeGoal
                    ? "bg-brand text-white"
                    : "bg-ink/5 text-ink/70 hover:bg-brand-light hover:text-brand-dark"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="5" />
                  <circle cx="12" cy="12" r="1" />
                </svg>
                {activeGoal ?? "Mon objectif"}
              </button>
            </div>

            {/* Filter chips row */}
            <div className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4 py-3">
              {FILTERS.map((filter) => (
                <Chip
                  key={filter}
                  active={filter === activeFilter}
                  onClick={() => updateFilter(filter)}
                >
                  {filter}
                </Chip>
              ))}
            </div>

            {/* Search + sort row */}
            <div className="flex flex-col gap-2 border-t border-ink/[0.05] px-3 py-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative flex-1">
                <svg
                  viewBox="0 0 24 24"
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Chercher un spot, une cuisine, un quartier…"
                  className="h-10 w-full rounded-full border border-ink/[0.08] bg-cream/80 pl-9 pr-4 text-[13.5px] text-ink placeholder:text-ink/40 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="flex items-center gap-2 sm:shrink-0">
                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])
                  }
                  className="h-10 appearance-none rounded-full border border-ink/[0.08] bg-cream/80 px-4 pr-8 text-[12.5px] font-semibold text-ink/80 focus:border-brand/40 focus:outline-none"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23141b1f' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Goal panel — collapsible */}
            {showGoalPanel ? (
              <div className="border-t border-ink/[0.05] bg-brand-soft px-4 py-3 animate-fade-up">
                <p className="text-[12px] font-semibold text-brand-deep">
                  Objectif nutritionnel
                </p>
                <p className="mt-0.5 text-[11.5px] text-ink/65">
                  Pour repérer vite un spot qui colle à ta journée.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {GOALS.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => {
                        setActiveGoal((current) => (current === goal ? null : goal));
                        setShowGoalPanel(false);
                        void trackEvent({
                          event_name: "goal_filter_selected",
                          metadata: { goal },
                        });
                      }}
                      className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition ${
                        activeGoal === goal
                          ? "bg-brand text-white"
                          : "bg-white text-ink/75 ring-1 ring-ink/10 hover:text-brand"
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {!showGoalPanel && recommendationText ? (
              <div className="border-t border-ink/[0.05] bg-brand-soft px-4 py-2.5">
                <p className="text-[11.5px] font-medium text-brand-deep">
                  {recommendationText}
                </p>
              </div>
            ) : null}

            {locationMessage ? (
              <div className="border-t border-ink/[0.05] px-4 py-2">
                <p className="text-[11px] text-ink/60">{locationMessage}</p>
              </div>
            ) : null}
          </div>

          <div className="mt-2 space-y-2">
            {bestChoiceRestaurant ? (
              <DiscoverBestChoiceCard
                restaurant={bestChoiceRestaurant}
                intentMode={intentModeForRanking}
                intentLabel={
                  activeGoal ?? getIntentTag(intentModeForRanking)
                }
                distanceKm={getRestaurantDistance(bestChoiceRestaurant)}
                detailHref={`/restaurants/${bestChoiceRestaurant.id}`}
              />
            ) : null}
            <DiscoverWeekStrip items={weekSpotlights} />
          </div>
        </div>
      </div>

      {/* === Map === */}
      <MapContainer
        center={PARIS_CENTER}
        zoom={12}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <RecenterMap center={mapCenter} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {userPosition ? (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>Vous êtes là.</Popup>
          </Marker>
        ) : null}

        {mappableRestaurants.map((restaurant) => (
          <Marker
            key={restaurant.id}
            position={[restaurant.latitude!, restaurant.longitude!]}
            icon={createRestaurantMarkerIcon(
              restaurant,
              activeRestaurantId === restaurant.id
            )}
            eventHandlers={{
              click: () => {
                setActiveRestaurantId(restaurant.id);
                setMapCenter([
                  restaurant.latitude! + 0.0016,
                  restaurant.longitude!,
                ]);
                void trackEvent({
                  event_name: "restaurant_marker_clicked",
                  restaurant_id: restaurant.id,
                  metadata: { source: "map_marker" },
                });
                void trackUserHistory("clicked_marker", restaurant.id, {
                  source: "map_marker",
                });
              },
            }}
          >
            <Popup className="healthyhub-popup" closeButton={false} maxWidth={300}>
              <div className="w-[280px] space-y-3">
                <div className="relative h-32 overflow-hidden rounded-2xl bg-brand-light">
                  <RestaurantImage
                    restaurant={restaurant}
                    alt={restaurant.name}
                    className="h-full w-full object-cover"
                  />
                  <HeartButton
                    active={favorites.includes(restaurant.id)}
                    onClick={() => toggleFavorite(restaurant.id)}
                    className="absolute right-2.5 top-2.5"
                  />
                  <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
                    {restaurant.category ? (
                      <span className="rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-brand-deep shadow-soft">
                        {restaurant.category}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-ink">
                    {restaurant.name}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {getRestaurantDistance(restaurant) != null ? (
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10.5px] font-semibold text-ink/75">
                        {getRestaurantDistance(restaurant)!.toFixed(1)} km
                      </span>
                    ) : null}
                    <ScoreBadge score={displayHealthyScore(restaurant)} />
                    <RatingMini
                      rating={restaurant.rating}
                      count={restaurant.review_count}
                    />
                  </div>
                  <p className="mt-2 text-[11.5px] leading-snug text-ink/75">
                    <span className="font-semibold text-brand-deep">
                      Pourquoi ce choix ·{" "}
                    </span>
                    {whyOneLine(restaurant)}
                  </p>
                  <ServiceAndHoursRow restaurant={restaurant} />
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    className="mt-2 block text-[12.5px] leading-snug text-ink/85"
                    onClick={() =>
                      void trackEvent({
                        event_name: "recommended_dish_clicked",
                        restaurant_id: restaurant.id,
                        metadata: {
                          source: "map_popup",
                          intent: intentModeForRanking,
                        },
                      })
                    }
                  >
                    <span className="font-semibold text-brand-deep">
                      Plat conseillé ·{" "}
                    </span>
                    {getHighlightedDish(restaurant)}
                  </Link>
                  <div className="mt-2">
                    <MacrosTeaser
                      restaurant={restaurant}
                      dishName={getHighlightedDish(restaurant)}
                      variant="compact"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {getPrimaryActionUrl(restaurant) ? (
                    <a
                      href={getPrimaryActionUrl(restaurant)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        void (async () => {
                          await trackEvent({
                            event_name: "order_clicked",
                            restaurant_id: restaurant.id,
                            metadata: { source: "map_popup" },
                          });
                          await trackEvent({
                            event_name: "restaurant_order_clicked",
                            restaurant_id: restaurant.id,
                            metadata: {
                              source: "map_popup",
                              platform: restaurant.uber_eats_url
                                ? "ubereats"
                                : "deliveroo",
                            },
                          });
                          await trackUserHistory(
                            restaurant.uber_eats_url
                              ? "clicked_order_ubereats"
                              : "clicked_order_deliveroo",
                            restaurant.id,
                            { source: "map_popup" }
                          );
                        })()
                      }
                      className="inline-flex h-9 min-h-[44px] min-w-[100px] flex-1 items-center justify-center rounded-full bg-brand px-3 text-[12.5px] font-semibold !text-white shadow-soft transition hover:bg-brand-dark"
                    >
                      Commander
                    </a>
                  ) : null}
                  <RestaurantNavigateCTA
                    restaurant={restaurant}
                    source="map_popup"
                    hasOrderLinks={Boolean(getPrimaryActionUrl(restaurant))}
                    size="md"
                    distanceKm={getRestaurantDistance(restaurant)}
                    showDistance
                    className="min-w-[100px] flex-1 flex-col"
                  />
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    onClick={() =>
                        void (async () => {
                          await trackEvent({
                            event_name: "restaurant_card_clicked",
                            restaurant_id: restaurant.id,
                            metadata: { source: "map_popup" },
                          });
                          await trackUserHistory("clicked_card", restaurant.id, {
                            source: "map_popup",
                          });
                        })()
                    }
                    className="inline-flex h-9 min-h-[44px] min-w-[72px] shrink-0 items-center justify-center rounded-full bg-white px-3 text-[12.5px] font-semibold !text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
                  >
                    Voir
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* === Desktop sidebar === */}
      <aside className="absolute bottom-6 left-4 top-[420px] z-[900] hidden w-[360px] overflow-hidden rounded-[28px] bg-white/95 shadow-floating ring-1 ring-ink/[0.06] backdrop-blur-xl lg:block">
        <div className="flex items-baseline justify-between border-b border-ink/[0.05] px-5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-deep/80">
            Spots autour de toi
          </p>
          <p className="text-[11px] text-ink/55">{filtered.length} lieux</p>
        </div>
        <div className="scrollbar-premium h-full space-y-2.5 overflow-y-auto px-3 pb-16 pt-3">
          {listForPanels.map((restaurant) => {
            const isFavorite = favorites.includes(restaurant.id);
            const distance = getRestaurantDistance(restaurant);
            const isActive = activeRestaurantId === restaurant.id;
            const dish = getHighlightedDish(restaurant);
            return (
              <article
                key={`desktop-${restaurant.id}`}
                onClick={() => {
                  setActiveRestaurantId(restaurant.id);
                  if (restaurant.latitude != null && restaurant.longitude != null) {
                    setMapCenter([restaurant.latitude, restaurant.longitude]);
                  }
                }}
                className={`group cursor-pointer rounded-2xl bg-white p-3 ring-1 transition duration-250 ease-out-expo hover:-translate-y-0.5 hover:shadow-elevated ${
                  isActive
                    ? "ring-brand/40 shadow-elevated"
                    : "ring-ink/[0.06]"
                }`}
              >
                <div className="relative h-32 overflow-hidden rounded-xl bg-brand-light">
                  <RestaurantImage
                    restaurant={restaurant}
                    alt={restaurant.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <HeartButton
                    active={isFavorite}
                    onClick={() => toggleFavorite(restaurant.id)}
                    className="absolute right-2 top-2"
                  />
                  {restaurant.category ? (
                    <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-deep shadow-soft">
                      {restaurant.category}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-[14.5px] font-semibold tracking-tight text-ink">
                      {restaurant.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {distance != null ? (
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10.5px] font-semibold text-ink/75">
                        {distance.toFixed(1)} km
                      </span>
                    ) : null}
                    <ScoreBadge score={displayHealthyScore(restaurant)} />
                    <RatingMini
                      rating={restaurant.rating}
                      count={restaurant.review_count}
                    />
                  </div>
                  <p className="text-[11.5px] leading-snug text-ink/75">
                    <span className="font-semibold text-brand-deep">
                      Pourquoi ce choix ·{" "}
                    </span>
                    {whyOneLine(restaurant)}
                  </p>
                  <ServiceAndHoursRow restaurant={restaurant} />
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    className="mt-1.5 block text-[12px] leading-snug text-ink/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      void trackEvent({
                        event_name: "recommended_dish_clicked",
                        restaurant_id: restaurant.id,
                        metadata: {
                          source: "desktop_panel",
                          intent: intentModeForRanking,
                        },
                      });
                    }}
                  >
                    <span className="font-semibold text-brand-deep">
                      Plat conseillé ·{" "}
                    </span>
                    {dish}
                  </Link>
                  <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                    <MacrosTeaser
                      restaurant={restaurant}
                      dishName={dish}
                      variant="compact"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {restaurant.uber_eats_url || restaurant.deliveroo_url ? (
                    <a
                      href={getPrimaryActionUrl(restaurant) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                        void trackEvent({
                          event_name: "order_clicked",
                          restaurant_id: restaurant.id,
                          metadata: { source: "desktop_panel" },
                        });
                        void trackEvent({
                          event_name: "restaurant_order_clicked",
                          restaurant_id: restaurant.id,
                          metadata: {
                            source: "desktop_panel",
                            platform: restaurant.uber_eats_url
                              ? "ubereats"
                              : "deliveroo",
                          },
                        });
                        void trackUserHistory(
                          restaurant.uber_eats_url
                            ? "clicked_order_ubereats"
                            : "clicked_order_deliveroo",
                          restaurant.id,
                          {
                          source: "desktop_panel",
                          platform: restaurant.uber_eats_url
                            ? "ubereats"
                            : "deliveroo",
                          }
                        );
                      }}
                      className="inline-flex h-8 min-h-[36px] min-w-[100px] flex-1 items-center justify-center rounded-full bg-brand px-3 text-[12px] font-semibold !text-white shadow-soft transition hover:bg-brand-dark"
                    >
                      Commander
                    </a>
                  ) : (
                    <span className="inline-flex h-8 min-h-[36px] min-w-[100px] flex-1 cursor-not-allowed items-center justify-center rounded-full bg-ink/5 px-3 text-[11.5px] font-semibold text-ink/45">
                      Pas d&apos;app livraison listée
                    </span>
                  )}
                  <RestaurantNavigateCTA
                    restaurant={restaurant}
                    source="desktop_panel"
                    hasOrderLinks={Boolean(
                      restaurant.uber_eats_url || restaurant.deliveroo_url
                    )}
                    size="sm"
                    distanceKm={distance}
                    showDistance
                    className="min-w-[100px] flex-1 flex-col"
                  />
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      void trackEvent({
                        event_name: "restaurant_card_clicked",
                        restaurant_id: restaurant.id,
                        metadata: { source: "desktop_panel" },
                      });
                      void trackUserHistory("clicked_card", restaurant.id, {
                        source: "desktop_panel",
                      });
                    }}
                    className="inline-flex h-8 min-h-[36px] shrink-0 items-center justify-center rounded-full bg-white px-3 text-[12px] font-semibold !text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
                  >
                    Voir
                  </Link>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-[12.5px] text-ink/55">
              Pas de spot avec ces critères. Essaie une autre catégorie.
            </div>
          ) : null}
        </div>
      </aside>

      {/* === Mobile bottom carousel === */}
      <div className="absolute inset-x-0 bottom-0 z-[1000] px-3 pb-4 sm:px-4 sm:pb-6 lg:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-white/95 p-4 text-[13px] text-ink/65 shadow-floating ring-1 ring-ink/[0.06] backdrop-blur">
            Pas de spot avec ces critères. Essaie une autre catégorie.
          </div>
        ) : (
          <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
            {listForPanels.map((restaurant) => {
              const isFavorite = favorites.includes(restaurant.id);
              const distance = getRestaurantDistance(restaurant);
              const isActive = activeRestaurantId === restaurant.id;
              const dish = getHighlightedDish(restaurant);
              return (
                <article
                  key={restaurant.id}
                  className={`w-[280px] shrink-0 overflow-hidden rounded-[24px] bg-white shadow-floating ring-1 transition ${
                    isActive ? "ring-brand/50" : "ring-ink/[0.06]"
                  }`}
                >
                  <div className="relative h-36 overflow-hidden bg-brand-light">
                    <RestaurantImage
                      restaurant={restaurant}
                      alt={restaurant.name}
                      className="h-full w-full object-cover"
                    />
                    <HeartButton
                      active={isFavorite}
                      onClick={() => toggleFavorite(restaurant.id)}
                      className="absolute right-2.5 top-2.5"
                    />
                    {restaurant.category ? (
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-brand-deep shadow-soft">
                        {restaurant.category}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2 px-4 pb-3 pt-3">
                    <h3 className="truncate text-[14.5px] font-semibold tracking-tight text-ink">
                      {restaurant.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {distance != null ? (
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10.5px] font-semibold text-ink/75">
                          {distance.toFixed(1)} km
                        </span>
                      ) : null}
                      <ScoreBadge score={displayHealthyScore(restaurant)} />
                      <RatingMini
                        rating={restaurant.rating}
                        count={restaurant.review_count}
                      />
                    </div>
                    <p className="text-[11.5px] leading-snug text-ink/75">
                      <span className="font-semibold text-brand-deep">
                        Pourquoi ce choix ·{" "}
                      </span>
                      {whyOneLine(restaurant)}
                    </p>
                    <ServiceAndHoursRow restaurant={restaurant} />
                    <Link
                      href={`/restaurants/${restaurant.id}`}
                      className="line-clamp-2 block text-[12px] leading-snug text-ink/75"
                      onClick={() =>
                        void trackEvent({
                          event_name: "recommended_dish_clicked",
                          restaurant_id: restaurant.id,
                          metadata: {
                            source: "floating_card",
                            intent: intentModeForRanking,
                          },
                        })
                      }
                    >
                      <span className="font-semibold text-brand-deep">
                        Plat conseillé ·{" "}
                      </span>
                      {dish}
                    </Link>
                    <div className="pt-1">
                      <MacrosTeaser
                        restaurant={restaurant}
                        dishName={dish}
                        variant="compact"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {restaurant.uber_eats_url || restaurant.deliveroo_url ? (
                        <a
                          href={getPrimaryActionUrl(restaurant) ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            void (async () => {
                              await trackEvent({
                                event_name: "order_clicked",
                                restaurant_id: restaurant.id,
                                metadata: { source: "floating_card" },
                              });
                              await trackEvent({
                                event_name: "restaurant_order_clicked",
                                restaurant_id: restaurant.id,
                                metadata: {
                                  source: "floating_card",
                                  platform: restaurant.uber_eats_url
                                    ? "ubereats"
                                    : "deliveroo",
                                },
                              });
                              await trackUserHistory(
                                restaurant.uber_eats_url
                                  ? "clicked_order_ubereats"
                                  : "clicked_order_deliveroo",
                                restaurant.id,
                                { source: "floating_card" }
                              );
                            })()
                          }
                          className="inline-flex h-9 min-h-[44px] min-w-[100px] flex-1 items-center justify-center rounded-full bg-brand px-3 text-[12.5px] font-semibold !text-white shadow-soft transition hover:bg-brand-dark"
                        >
                          Commander
                        </a>
                      ) : (
                        <span className="inline-flex h-9 min-h-[44px] min-w-[100px] flex-1 cursor-not-allowed items-center justify-center rounded-full bg-ink/5 px-3 text-[12px] font-semibold text-ink/45">
                          Pas d&apos;app listée
                        </span>
                      )}
                      <RestaurantNavigateCTA
                        restaurant={restaurant}
                        source="floating_card"
                        hasOrderLinks={Boolean(
                          restaurant.uber_eats_url || restaurant.deliveroo_url
                        )}
                        size="md"
                        distanceKm={distance}
                        showDistance
                        className="min-w-[100px] flex-1 flex-col"
                      />
                      <Link
                        href={`/restaurants/${restaurant.id}`}
                        onClick={() =>
                          void (async () => {
                            await trackEvent({
                              event_name: "restaurant_card_clicked",
                              restaurant_id: restaurant.id,
                              metadata: { source: "floating_card" },
                            });
                            await trackUserHistory("clicked_card", restaurant.id, {
                              source: "floating_card",
                            });
                          })()
                        }
                        className="inline-flex h-9 min-h-[44px] shrink-0 items-center justify-center rounded-full bg-white px-3 text-[12.5px] font-semibold !text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
                      >
                        Voir
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      {showLoginPrompt ? (
        <div className="fixed inset-0 z-[1400] flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <p className="text-base font-semibold text-ink">
              Connecte-toi pour garder tes spots en favoris.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/login"
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white"
              >
                Se connecter
              </Link>
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-ink/15"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
