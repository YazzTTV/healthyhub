"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Recalcule la taille Leaflet après montage / resize (évite carte invisible). */
export default function MapInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const run = () => map.invalidateSize();
    const t = window.setTimeout(run, 0);
    window.addEventListener("resize", run);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", run);
    };
  }, [map]);

  return null;
}
