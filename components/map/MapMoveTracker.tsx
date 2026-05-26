"use client";

import { useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { trackMapMoved } from "@/lib/analytics";

const DEBOUNCE_MS = 1200;

/** Enregistre `map_moved` après déplacement / zoom (debounced). */
export default function MapMoveTracker() {
  const map = useMap();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRef = useRef<string>("");

  useMapEvents({
    moveend: () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const key = `${center.lat.toFixed(4)},${center.lng.toFixed(4)},${zoom}`;
        if (key === lastRef.current) return;
        lastRef.current = key;
        trackMapMoved({
          lat: center.lat,
          lng: center.lng,
          zoom,
        });
      }, DEBOUNCE_MS);
    },
  });

  return null;
}
