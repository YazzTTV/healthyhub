"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { fetchDiscoverCatalogAction } from "@/app/discover/actions";
import DiscoverCatalogSkeleton from "@/components/discover/DiscoverCatalogSkeleton";
import DiscoverPanelCard from "@/components/discover/DiscoverPanelCard";
import LoadMore from "@/components/discover/LoadMore";
import { DISCOVER_PAGE_SIZE } from "@/lib/discover-constants";
import type { DiscoverMapPin } from "@/lib/fetch-discover-map-pins";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import {
  trackCategorySelected,
  trackDiscoverOpened,
  trackFavoriteAdded,
  trackFavoriteRemoved,
  trackFilterUsed,
  trackRestaurantCardClick,
  trackRestaurantMarkerClick,
  trackScrollDepth,
  trackTimeOnDiscover,
} from "@/lib/analytics";
import MapMoveTracker from "@/components/map/MapMoveTracker";
import MapInvalidateSize from "@/components/map/MapInvalidateSize";
import type { RestaurantListItem } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  readFavoriteIdsFromStorage,
  writeFavoriteIdsToStorage,
  notifyLocalFavoritesChanged,
  LOCAL_FAVORITES_CHANGED_EVENT,
} from "@/lib/local-favorites";
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
import { getMapPopupImageUrl } from "@/lib/restaurant-images";
import { displayHealthyScore } from "@/lib/healthy-score";
import {
  getIntentReason,
  getIntentTag,
  type IntentMode,
} from "@/lib/intent";
import { getSpotHighlight, getSignatureDishName } from "@/lib/signature-dish";
import {
  buildWeekSpotlights,
  getBestChoice,
  rankRestaurantsForIntent,
} from "@/lib/discover-recommendations";
import {
  effectiveCalorieBand,
  effectiveCleanBand,
  effectiveProteinBand,
  getDisplayRating,
  getDisplayReviewCount,
  isValidMapCoordinates,
} from "@/lib/restaurant-helpers";
import { calculateDistanceKm } from "@/lib/geo";
import {
  FILTERS,
  SORT_OPTIONS,
  type DiscoverGoal,
} from "@/components/discover/constants";
import DiscoverFiltersSheet from "@/components/discover/DiscoverFiltersSheet";
import type { FiltersDraft } from "@/components/discover/DiscoverFiltersSheet";
import DiscoverGoalSheet from "@/components/discover/DiscoverGoalSheet";
import DiscoverMobileTray from "@/components/discover/DiscoverMobileTray";
import DiscoverToast from "@/components/discover/DiscoverToast";
import DiscoverTopBar from "@/components/discover/DiscoverTopBar";

const PARIS_CENTER: [number, number] = [48.8566, 2.3522];
type NutritionLevel = "low" | "medium" | "high";

type RestaurantProfile = {
  protein_level: NutritionLevel;
  calorie_level: NutritionLevel;
  clean_level: NutritionLevel;
  recommended_for_weight_loss: boolean;
  recommended_for_muscle_gain: boolean;
  recommended_for_clean_eating: boolean;
};

function mapGoalToIntent(goal: DiscoverGoal): IntentMode {
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

  const resolvedCalorie =
    effectiveCalorieBand(restaurant) ?? calorie_level;

  return {
    protein_level: effectiveProteinBand(restaurant) ?? protein_level,
    calorie_level: resolvedCalorie,
    clean_level: effectiveCleanBand(restaurant) ?? clean_level,
    recommended_for_weight_loss:
      restaurant.recommended_for_weight_loss ??
      restaurant.lunch_light_fit ??
      ((calorie_level === "low" || calorie_level === "medium") &&
        clean_level === "high" &&
        healthyScore >= 4),
    recommended_for_muscle_gain:
      restaurant.recommended_for_muscle_gain ??
      restaurant.muscle_recovery_fit ??
      (protein_level === "high" && healthyScore >= 3),
    recommended_for_clean_eating:
      restaurant.recommended_for_clean_eating ??
      (clean_level === "high" && healthyScore >= 4),
  };
}

function rankRestaurantForGoal(
  restaurant: RestaurantListItem,
  goal: DiscoverGoal,
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
  goal: DiscoverGoal,
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
      if (restaurant.lunch_light_fit === true && healthyScore >= 3.4) return true;
      return (
        (profile.calorie_level === "low" || profile.calorie_level === "medium") &&
        profile.clean_level === "high" &&
        healthyScore >= 4 &&
        profile.recommended_for_weight_loss
      );
    }
    if (goal === "Prise de muscle") {
      if (restaurant.muscle_recovery_fit === true && healthyScore >= 3.2) return true;
      return (
        profile.protein_level === "high" &&
        healthyScore >= 3 &&
        profile.recommended_for_muscle_gain
      );
    }
    if (restaurant.focus_productivity_fit === true && healthyScore >= 3.5) return true;
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

function mapPinToListItem(pin: DiscoverMapPin): RestaurantListItem {
  return {
    ...pin,
    description: null,
    cuisine: null,
    tags: null,
    review_count: null,
    website_url: null,
    uber_eats_url: null,
    deliveroo_url: null,
    created_at: null,
  } as RestaurantListItem;
}

// === Main component ===
export default function RestaurantMap({
  mapPins,
  initialPageRestaurants,
  initialPage,
  totalCount,
}: {
  mapPins: DiscoverMapPin[];
  initialPageRestaurants: RestaurantListItem[];
  initialPage: number;
  totalCount: number;
}) {
  const [catalog, setCatalog] = useState<RestaurantListItem[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [listVisibleCount, setListVisibleCount] = useState(DISCOVER_PAGE_SIZE);
  const [loadedServerPage, setLoadedServerPage] = useState(initialPage);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("Tous");
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>("Score healthy");
  const [activeGoal, setActiveGoal] = useState<DiscoverGoal | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [goalSheetOpen, setGoalSheetOpen] = useState(false);
  const [mobileTrayExpanded, setMobileTrayExpanded] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  /** Évite l’erreur Leaflet « Map container is already initialized » avec React Strict Mode (double montage en dev). */
  const [leafletReady, setLeafletReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(PARIS_CENTER);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [activeRestaurantId, setActiveRestaurantId] = useState<string | null>(null);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  useEffect(() => {
    setHydrated(true);
  }, []);

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
        setFavorites(readFavoriteIdsFromStorage());
      }
    };
    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        void getUserFavorites(nextUser.id).then((rows) => {
          setFavorites(rows.map((r) => r.restaurant_id));
        });
      } else {
        setFavorites(readFavoriteIdsFromStorage());
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) return;
    const onLocalFav = () => setFavorites(readFavoriteIdsFromStorage());
    window.addEventListener(LOCAL_FAVORITES_CHANGED_EVENT, onLocalFav);
    return () =>
      window.removeEventListener(LOCAL_FAVORITES_CHANGED_EVENT, onLocalFav);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { restaurants: full, error } = await fetchDiscoverCatalogAction();
      if (!mounted) return;
      if (!error && full.length > 0) {
        setCatalog(full);
      }
      setCatalogLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const restaurants = catalog ?? initialPageRestaurants;

  useEffect(() => {
    setListVisibleCount(DISCOVER_PAGE_SIZE);
    setLoadedServerPage(1);
  }, [search, activeFilter, sortBy, activeGoal]);

  const filtersActive =
    Boolean(search.trim()) ||
    activeFilter !== "Tous" ||
    sortBy !== "Score healthy" ||
    activeGoal != null;

  useEffect(() => {
    trackDiscoverOpened({ restaurant_count: totalCount });
    const startedAt = Date.now();
    let maxScroll = 0;

    const onScroll = () => {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((window.scrollY / scrollable) * 100);
      if (pct > maxScroll) maxScroll = pct;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      const seconds = Math.round((Date.now() - startedAt) / 1000);
      if (seconds >= 5) trackTimeOnDiscover(seconds);
      if (maxScroll >= 25) {
        trackScrollDepth("discover", maxScroll);
      }
    };
  }, [totalCount]);

  useEffect(() => {
    if (!hydrated) return;
    setLeafletReady(true);
  }, [hydrated]);

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
      setToastMessage("Géolocalisation indisponible sur ce navigateur.");
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
        setToastMessage(
          "Position détectée — on met en avant les spots les plus proches."
        );
      },
      () => {
        setUserPosition(null);
        setMapCenter(PARIS_CENTER);
        setToastMessage(
          "Localisation inactive — carte centrée sur Paris en attendant."
        );
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  const toggleFavorite = async (restaurantId: string) => {
    const restaurant = restaurants.find((r) => r.id === restaurantId);

    if (!user) {
      setFavorites((previous) => {
        const exists = previous.includes(restaurantId);
        const next = exists
          ? previous.filter((id) => id !== restaurantId)
          : [...previous, restaurantId];
        writeFavoriteIdsToStorage(next);
        if (restaurant) {
          if (exists) {
            trackFavoriteRemoved(restaurant, { source: "discover_map_local" });
          } else {
            trackFavoriteAdded(restaurant, { source: "discover_map_local" });
          }
        }
        notifyLocalFavoritesChanged();
        return next;
      });
      return;
    }

    setFavorites((previous) => {
      const exists = previous.includes(restaurantId);
      const next = exists
        ? previous.filter((id) => id !== restaurantId)
        : [...previous, restaurantId];
      if (restaurant) {
        if (exists) trackFavoriteRemoved(restaurant, { source: "discover_map" });
        else trackFavoriteAdded(restaurant, { source: "discover_map" });
      }
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
        ((activeFilter === "Coups de cœur" ||
          activeFilter === "Mes favoris") &&
          favorites.includes(restaurant.id)) ||
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
      return list.sort(
        (a, b) => (getDisplayRating(b) ?? 0) - (getDisplayRating(a) ?? 0)
      );
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

  const visibleListForPanels = useMemo(
    () => listForPanels.slice(0, listVisibleCount),
    [listForPanels, listVisibleCount]
  );

  const listHasMore = catalog
    ? listVisibleCount < listForPanels.length
    : loadedServerPage * DISCOVER_PAGE_SIZE < totalCount;

  const restaurantById = useMemo(
    () => new Map(restaurants.map((r) => [r.id, r])),
    [restaurants]
  );

  const filteredIds = useMemo(
    () => new Set(filtered.map((r) => r.id)),
    [filtered]
  );

  const mappablePins = useMemo(() => {
    const pool = catalog
      ? mapPins.filter((p) => filteredIds.has(p.id))
      : mapPins;
    return pool.filter((p) =>
      isValidMapCoordinates(p.latitude, p.longitude)
    );
  }, [mapPins, catalog, filteredIds]);

  const recommendationText = useMemo(() => {
    if (activeGoal === "Perte de poids")
      return "On met en avant des spots légers et équilibrés pour ton objectif.";
    if (activeGoal === "Prise de muscle")
      return "On privilégie les adresses riches en protéines autour de toi.";
    if (activeGoal === "Manger clean")
      return "On classe les lieux les plus clean selon ton périmètre.";
    return null;
  }, [activeGoal]);

  useEffect(() => {
    if (!activeGoal || !recommendationText) return;
    setToastMessage(recommendationText);
  }, [activeGoal, recommendationText]);

  const filtersDraftSnapshot = useMemo<FiltersDraft>(
    () => ({ search, filter: activeFilter, sort: sortBy }),
    [search, activeFilter, sortBy]
  );

  const filtersActiveCount =
    (search.trim() ? 1 : 0) +
    (activeFilter !== "Tous" ? 1 : 0) +
    (sortBy !== "Score healthy" ? 1 : 0);

  const applyFilters = useCallback(
    (draft: FiltersDraft) => {
      setSearch(draft.search);
      setActiveFilter(draft.filter);
      setSortBy(draft.sort);
      const filter_type = draft.search.trim()
        ? "search"
        : draft.filter !== "Tous"
          ? "category"
          : draft.sort !== "Score healthy"
            ? "sort"
            : "combined";
      trackFilterUsed({
        filter_type,
        filter: draft.filter,
        sort: draft.sort,
        has_search: Boolean(draft.search.trim()),
        objective_name: activeGoal,
        source: "discover_filters",
      });
      if (draft.filter !== "Tous") {
        trackCategorySelected(draft.filter, {
          objective_name: activeGoal,
          source: "discover_filters",
        });
      }
    },
    [activeGoal]
  );

  const toastBottomClassName =
    mobileTrayExpanded
      ? "bottom-[min(46vh,300px)] sm:bottom-8 lg:bottom-6"
      : "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-8 lg:bottom-6";

  /** Plat réel ou concept cuisine — jamais de nom inventé. */
  const getSpotLine = (restaurant: RestaurantListItem) => {
    const highlight = getSpotHighlight(restaurant);
    if (!highlight) return null;
    if (highlight.kind === "signature_dish") {
      return { prefix: "Plat phare · ", text: highlight.label };
    }
    return { prefix: "", text: highlight.label };
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
      <DiscoverTopBar
        spotCount={filtered.length}
        onLocate={handleLocate}
        onOpenFilters={() => setFiltersOpen(true)}
        filtersActiveCount={filtersActiveCount}
        onOpenGoal={() => setGoalSheetOpen(true)}
        activeGoal={activeGoal}
        onClearGoal={() => setActiveGoal(null)}
      />

      <DiscoverFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        initialDraft={filtersDraftSnapshot}
        onApply={applyFilters}
      />

      <DiscoverGoalSheet
        open={goalSheetOpen}
        onClose={() => setGoalSheetOpen(false)}
        activeGoal={activeGoal}
        onSelectGoal={(goal) => setActiveGoal(goal)}
      />

      <DiscoverToast
        message={toastMessage}
        onDismiss={dismissToast}
        bottomClassName={toastBottomClassName}
      />

      {/* === Map === */}
      {leafletReady ? (
      <MapContainer
        key="discover-map"
        center={PARIS_CENTER}
        zoom={12}
        scrollWheelZoom={false}
        touchZoom
        doubleClickZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <MapInvalidateSize />
        <RecenterMap center={mapCenter} />
        <MapMoveTracker />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {userPosition ? (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>Vous êtes là.</Popup>
          </Marker>
        ) : null}

        {mappablePins.map((pin) => {
          const restaurant =
            restaurantById.get(pin.id) ?? mapPinToListItem(pin);
          return (
          <Marker
            key={pin.id}
            position={[pin.latitude!, pin.longitude!]}
            icon={createRestaurantMarkerIcon(
              restaurant,
              activeRestaurantId === pin.id
            )}
            eventHandlers={{
              click: () => {
                setActiveRestaurantId(pin.id);
                setMapCenter([
                  pin.latitude! + 0.0016,
                  pin.longitude!,
                ]);
                trackRestaurantMarkerClick(restaurant, "map_marker");
                void trackUserHistory("clicked_marker", pin.id, {
                  source: "map_marker",
                });
              },
            }}
          >
            <Popup className="healthyhub-popup" closeButton={false} maxWidth={300}>
              {(() => {
                const popupImageUrl = getMapPopupImageUrl(restaurant);
                return (
              <div className="w-[260px]">
                {/* Header — name + heart + thumb */}
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-light">
                    {popupImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={popupImageUrl}
                        alt={restaurant.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <RestaurantImage
                        restaurant={restaurant}
                        alt={restaurant.name}
                        sizes="56px"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-[14px] font-semibold leading-tight tracking-tight text-ink">
                        {restaurant.name}
                      </h3>
                      <HeartButton
                        active={favorites.includes(restaurant.id)}
                        onClick={() => toggleFavorite(restaurant.id)}
                        className="h-7 w-7 shrink-0"
                      />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="inline-flex h-5 items-center gap-0.5 rounded-full bg-brand px-1.5 text-[10.5px] font-semibold text-white">
                        ● {displayHealthyScore(restaurant).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata line */}
                <p className="mt-2 truncate text-[11px] text-ink-mute">
                  {[
                    getRestaurantDistance(restaurant) != null
                      ? `${getRestaurantDistance(restaurant)!.toFixed(1)} km`
                      : null,
                    restaurant.category,
                    getDisplayRating(restaurant) != null
                      ? `★ ${getDisplayRating(restaurant)!.toFixed(1)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>

                {whyOneLine(restaurant) ? (
                  <p className="mt-1.5 truncate text-[11.5px] leading-snug text-ink/75">
                    <span className="font-semibold text-brand-deep">Pourquoi · </span>
                    {whyOneLine(restaurant)}
                  </p>
                ) : null}
                {(() => {
                  const spot = getSpotLine(restaurant);
                  if (!spot) return null;
                  return (
                    <p className="mt-0.5 truncate text-[11.5px] leading-snug text-ink/70">
                      {spot.prefix ? (
                        <span className="font-semibold text-brand-deep">
                          {spot.prefix}
                        </span>
                      ) : null}
                      {spot.text}
                    </p>
                  );
                })()}

                {/* CTA — uniquement fiche restaurant */}
                <div className="mt-3 flex">
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    onClick={() =>
                      void (async () => {
                        trackRestaurantCardClick(restaurant, "map_popup");
                        await trackUserHistory("clicked_card", restaurant.id, {
                          source: "map_popup",
                        });
                      })()
                    }
                    className="inline-flex h-8 w-full flex-1 items-center justify-center rounded-full bg-white px-2.5 text-[11.5px] font-semibold !text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
                  >
                    Voir
                  </Link>
                </div>
              </div>
                );
              })()}
            </Popup>
          </Marker>
          );
        })}
      </MapContainer>
      ) : (
        <div
          className="h-full w-full bg-cream-deep"
          aria-hidden
        />
      )}

      {/* === Desktop sidebar === */}
      <aside className="absolute bottom-6 left-4 top-[5.25rem] z-[900] hidden w-[360px] overflow-hidden rounded-[28px] bg-white/95 shadow-floating ring-1 ring-ink/[0.06] backdrop-blur-xl lg:block">
        <div className="flex items-center border-b border-ink/[0.05] px-4 py-2">
          <p className="text-[14px] font-semibold tracking-tight text-ink">
            {filtered.length} adresses
          </p>
        </div>
        <div className="scrollbar-premium h-full space-y-2 overflow-y-auto px-3 pb-16 pt-2">
          {bestChoiceRestaurant ? (
            <div className="pb-1">
              <DiscoverBestChoiceCard
                restaurant={bestChoiceRestaurant}
                intentMode={intentModeForRanking}
                intentLabel={
                  activeGoal ?? getIntentTag(intentModeForRanking)
                }
                distanceKm={getRestaurantDistance(bestChoiceRestaurant)}
                detailHref={`/restaurants/${bestChoiceRestaurant.id}`}
              />
            </div>
          ) : null}
          <DiscoverWeekStrip items={weekSpotlights} />
          {catalogLoading && !catalog ? <DiscoverCatalogSkeleton /> : null}
          {visibleListForPanels.map((restaurant) => {
            const distance = getRestaurantDistance(restaurant);
            return (
              <DiscoverPanelCard
                key={`desktop-${restaurant.id}`}
                layout="desktop"
                restaurant={restaurant}
                isFavorite={favorites.includes(restaurant.id)}
                isActive={activeRestaurantId === restaurant.id}
                distanceLabel={
                  distance != null ? `${distance.toFixed(1)} km` : null
                }
                whyLine={whyOneLine(restaurant)}
                dishLine={(() => {
                  const spot = getSpotLine(restaurant);
                  return spot ? `${spot.prefix}${spot.text}` : null;
                })()}
                onSelect={() => {
                  setActiveRestaurantId(restaurant.id);
                  if (
                    restaurant.latitude != null &&
                    restaurant.longitude != null
                  ) {
                    setMapCenter([restaurant.latitude, restaurant.longitude]);
                  }
                }}
                onToggleFavorite={() => toggleFavorite(restaurant.id)}
                onCardClick={() => {
                  trackRestaurantCardClick(restaurant, "desktop_panel");
                  void trackUserHistory("clicked_card", restaurant.id, {
                    source: "desktop_panel",
                  });
                }}
              />
            );
          })}
          <Suspense fallback={null}>
            <LoadMore
              currentPage={loadedServerPage}
              hasMore={listHasMore}
              filtersActive={filtersActive}
              onClientLoadMore={() =>
                setListVisibleCount((c) => c + DISCOVER_PAGE_SIZE)
              }
              onServerAppend={(items, nextPage) => {
                setCatalog((prev) => {
                  const base = prev ?? [...initialPageRestaurants];
                  const ids = new Set(base.map((r) => r.id));
                  const merged = [...base];
                  for (const r of items) {
                    if (!ids.has(r.id)) merged.push(r);
                  }
                  return merged;
                });
                setLoadedServerPage(nextPage);
                setListVisibleCount(nextPage * DISCOVER_PAGE_SIZE);
              }}
            />
          </Suspense>
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink/15 p-6 text-center text-[12.5px] text-ink/55">
              Pas de spot avec ces critères. Essaie une autre catégorie.
            </div>
          ) : null}
        </div>
      </aside>

      {/* === Mobile bottom carousel === */}
      <div className="lg:hidden">
        <DiscoverMobileTray
          spotCount={filtered.length}
          expanded={mobileTrayExpanded}
          onToggleExpanded={() => setMobileTrayExpanded((v) => !v)}
        >
          {filtered.length === 0 ? (
            <div className="rounded-3xl bg-white/95 p-4 text-[13px] text-ink/65 shadow-floating ring-1 ring-ink/[0.06] backdrop-blur">
              Pas de spot avec ces critères. Essaie une autre catégorie.
            </div>
          ) : (
            <div className="space-y-3">
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
              <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
                {catalogLoading && !catalog ? (
                  <div className="w-[300px] shrink-0">
                    <DiscoverCatalogSkeleton />
                  </div>
                ) : null}
                {visibleListForPanels.map((restaurant) => {
                  const distance = getRestaurantDistance(restaurant);
                  return (
                    <DiscoverPanelCard
                      key={restaurant.id}
                      layout="mobile"
                      restaurant={restaurant}
                      isFavorite={favorites.includes(restaurant.id)}
                      isActive={activeRestaurantId === restaurant.id}
                      distanceLabel={
                        distance != null ? `${distance.toFixed(1)} km` : null
                      }
                      whyLine={whyOneLine(restaurant)}
                      dishLine={(() => {
                  const spot = getSpotLine(restaurant);
                  return spot ? `${spot.prefix}${spot.text}` : null;
                })()}
                      onSelect={() => {
                        setActiveRestaurantId(restaurant.id);
                        if (
                          restaurant.latitude != null &&
                          restaurant.longitude != null
                        ) {
                          setMapCenter([
                            restaurant.latitude,
                            restaurant.longitude,
                          ]);
                        }
                      }}
                      onToggleFavorite={() => toggleFavorite(restaurant.id)}
                      onCardClick={() => {
                        trackRestaurantCardClick(restaurant, "floating_card");
                        void trackUserHistory("clicked_card", restaurant.id, {
                          source: "floating_card",
                        });
                      }}
                    />
                  );
                })}
              </div>
              <Suspense fallback={null}>
                <LoadMore
                  currentPage={loadedServerPage}
                  hasMore={listHasMore}
                  filtersActive={filtersActive}
                  onClientLoadMore={() =>
                    setListVisibleCount((c) => c + DISCOVER_PAGE_SIZE)
                  }
                  onServerAppend={(items, nextPage) => {
                    setCatalog((prev) => {
                      const base = prev ?? [...initialPageRestaurants];
                      const ids = new Set(base.map((r) => r.id));
                      const merged = [...base];
                      for (const r of items) {
                        if (!ids.has(r.id)) merged.push(r);
                      }
                      return merged;
                    });
                    setLoadedServerPage(nextPage);
                    setListVisibleCount(nextPage * DISCOVER_PAGE_SIZE);
                  }}
                  className="px-2"
                />
              </Suspense>
            </div>
          )}
        </DiscoverMobileTray>
      </div>
    </section>
  );
}
