/**
 * Audit complet du pipeline images HealthyHub.
 * Usage: npm run audit:images
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";
import {
  getRestaurantImage,
  hasDisplayableRestaurantImage,
  isCredibleRestaurantImageUrl,
  isSyntheticPlaceholderImageUrl,
  resolveUsableImageUrl,
} from "@/lib/restaurant-images";
import { normalizeRestaurantRow } from "@/lib/normalize-restaurant-row";
import type { RestaurantListItem } from "@/lib/types";
import {
  RESTAURANT_SELECT_ENRICHED_EMBED,
  RESTAURANT_SELECT_ENRICHED_EMBED_LEGACY,
  RESTAURANT_SELECT_ENRICHED_FLAT,
  RESTAURANT_SELECT_ENRICHED_FLAT_LEGACY,
  RESTAURANT_SELECT_FULL,
  RESTAURANT_SELECT_FULL_LEGACY,
} from "@/lib/restaurant-select";

const SELECT_ATTEMPTS = [
  RESTAURANT_SELECT_ENRICHED_EMBED,
  RESTAURANT_SELECT_ENRICHED_FLAT,
  RESTAURANT_SELECT_FULL,
  RESTAURANT_SELECT_ENRICHED_EMBED_LEGACY,
  RESTAURANT_SELECT_ENRICHED_FLAT_LEGACY,
  RESTAURANT_SELECT_FULL_LEGACY,
];

function isRecoverableColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("column") ||
    m.includes("does not exist") ||
    m.includes("schema cache") ||
    m.includes("relationship")
  );
}

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const IMAGE_FIELDS = [
  "signature_dish_image_url",
  "restaurant_image_url",
  "restaurant_interior_image_url",
  "storefront_image_url",
  "image_url",
  "cover_image_url",
] as const;

type FieldKey = (typeof IMAGE_FIELDS)[number];

function countPopulated(rows: RestaurantListItem[], field: FieldKey): number {
  return rows.filter((r) => Boolean(r[field]?.trim())).length;
}

function countUsable(rows: RestaurantListItem[], field: FieldKey): number {
  return rows.filter((r) => resolveUsableImageUrl(r[field]) != null).length;
}

function countBlockedSynthetic(rows: RestaurantListItem[], field: FieldKey): number {
  return rows.filter((r) => {
    const raw = r[field]?.trim();
    return Boolean(raw) && isSyntheticPlaceholderImageUrl(raw);
  }).length;
}

function countRejectedNonCredible(rows: RestaurantListItem[], field: FieldKey): number {
  return rows.filter((r) => {
    const raw = r[field]?.trim();
    return Boolean(raw) && !resolveUsableImageUrl(raw) && !isSyntheticPlaceholderImageUrl(raw);
  }).length;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL / ANON_KEY requis");
    process.exit(1);
  }

  const supabase = createClient(url, key);

  let rows: RestaurantListItem[] = [];
  let selectUsed = "";

  let lastError = "";
  for (const select of SELECT_ATTEMPTS) {
    const { data, error } = await supabase.from("restaurants").select(select).order("name");
    if (!error && data && data.length > 0) {
      selectUsed = select;
      rows = data.map(normalizeRestaurantRow);
      break;
    }
    if (error) {
      lastError = error.message;
      if (!isRecoverableColumnError(error.message)) {
        console.error(error.message);
        process.exit(1);
      }
    }
  }

  if (!rows.length) {
    const fallback = await supabase
      .from("restaurants")
      .select("id, name, slug, image_url, image_status, signature_dish_image_url, category, cuisine")
      .order("name");
    if (fallback.error) {
      console.error(lastError || fallback.error.message);
      process.exit(1);
    }
    selectUsed = "minimal fallback";
    rows = (fallback.data ?? []).map(normalizeRestaurantRow);
  }

  if (!rows.length) {
    console.error("Aucun restaurant en base.");
    process.exit(1);
  }

  const total = rows.length;
  const withDisplayable = rows.filter((r) => hasDisplayableRestaurantImage(r)).length;
  const placeholderUi = total - withDisplayable;

  const hasAnyRawUrl = rows.filter((r) =>
    IMAGE_FIELDS.some((f) => Boolean(r[f]?.trim()))
  ).length;

  const hasRawButPlaceholder = rows.filter((r) => {
    const anyRaw = IMAGE_FIELDS.some((f) => Boolean(r[f]?.trim()));
    return anyRaw && !hasDisplayableRestaurantImage(r);
  });

  console.log("\n=== HEALTHYHUB IMAGE PIPELINE AUDIT ===\n");
  console.log(`SELECT utilisé: ${selectUsed.includes("restaurant_image_url") ? "full" : "LEGACY (sans colonnes dédiées)"}`);
  console.log(`Total restaurants: ${total}`);
  console.log(`Affichables UI (getRestaurantImage): ${withDisplayable} (${pct(withDisplayable, total)})`);
  console.log(`Placeholder UI: ${placeholderUi} (${pct(placeholderUi, total)})`);
  console.log(`Au moins une URL brute en base: ${hasAnyRawUrl}`);
  console.log(`URL en base mais placeholder UI: ${hasRawButPlaceholder.length}`);

  console.log("\n--- Champs en base (remplis / utilisables / synthétiques bloqués / rejetés) ---");
  for (const field of IMAGE_FIELDS) {
    const populated = countPopulated(rows, field);
    const usable = countUsable(rows, field);
    const synthetic = countBlockedSynthetic(rows, field);
    const rejected = countRejectedNonCredible(rows, field);
    console.log(
      `${field}: rempli=${populated} usable=${usable} manuscdn_bloqué=${synthetic} autre_rejet=${rejected}`
    );
  }

  const pickSource = (r: RestaurantListItem): string => {
    const img = getRestaurantImage(r);
    if (img.mode === "placeholder") return "placeholder";
    const src = img.src ?? "";
    if (src === resolveUsableImageUrl(r.signature_dish_image_url)) return "signature_dish_image_url";
    if (src === resolveUsableImageUrl(r.restaurant_image_url)) return "restaurant_image_url";
    if (src === resolveUsableImageUrl(r.restaurant_interior_image_url))
      return "restaurant_interior_image_url";
    if (src === resolveUsableImageUrl(r.storefront_image_url)) return "storefront_image_url";
    if (src === resolveUsableImageUrl(r.image_url)) return "image_url";
    if (src === resolveUsableImageUrl(r.cover_image_url)) return "cover_image_url";
    return "unknown";
  };

  const sourceTally: Record<string, number> = {};
  for (const r of rows) {
    const s = pickSource(r);
    sourceTally[s] = (sourceTally[s] ?? 0) + 1;
  }

  console.log("\n--- Source hero UI (après hiérarchie) ---");
  for (const [k, v] of Object.entries(sourceTally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  if (hasRawButPlaceholder.length > 0) {
    console.log("\n--- Exemples: URL en base → placeholder (max 15) ---");
    for (const r of hasRawButPlaceholder.slice(0, 15)) {
      const fields = IMAGE_FIELDS.map((f) => {
        const raw = r[f]?.trim();
        if (!raw) return null;
        const flags = [
          isSyntheticPlaceholderImageUrl(raw) ? "manuscdn" : null,
          !isCredibleRestaurantImageUrl(raw) ? "non-credible" : null,
          resolveUsableImageUrl(raw) ? "usable" : "filtered",
        ]
          .filter(Boolean)
          .join(",");
        return `${f}=${raw.slice(0, 60)}… [${flags || "raw"}]`;
      }).filter(Boolean);
      console.log(`  ${r.name} (${r.slug}): ${fields.join(" | ")}`);
    }
  }

  const soft = rows.find((r) => /soft lunch/i.test(r.name));
  if (soft) {
    console.log("\n--- Soft Lunch Paris ---");
    for (const f of IMAGE_FIELDS) {
      console.log(`  ${f}: ${soft[f]?.trim() || "(vide)"}`);
    }
    console.log(`  UI: ${JSON.stringify(getRestaurantImage(soft))}`);
  }

  console.log("\n=== FIN ===\n");
}

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
