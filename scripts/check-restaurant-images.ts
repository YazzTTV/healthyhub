/**
 * Vérifie, pour chaque restaurant, si l’URL d’image affichée par l’app (getRestaurantImage)
 * répond en HTTP. Aucune modification en base.
 *
 * Usage: npm run check:images
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import {
  getRestaurantImage,
  isCredibleRestaurantImageUrl,
} from "@/lib/restaurant-images";
import type { RestaurantListItem } from "@/lib/types";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const DELAY_MS = 250;
const TIMEOUT_MS = 8000;
const CSV_FILE = "restaurant-image-report.csv";

let requestCount = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function beforeReq(): Promise<void> {
  if (requestCount > 0) await sleep(DELAY_MS);
  requestCount += 1;
}

function csvEscape(field: string): string {
  const s = field ?? "";
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

async function probeImageUrl(url: string): Promise<{
  status: string;
  finalUrl: string;
  notes: string;
}> {
  await beforeReq();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "HealthyHub-ImageCheck/1.0 (+internal; npm run check:images)",
        Accept: "image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timer);
    const code = res.status;
    const finalUrl = res.url || url;
    if (code >= 200 && code < 300) {
      return { status: "ok", finalUrl, notes: `HTTP ${code}` };
    }
    if (code === 404 || code === 410) {
      return { status: "broken", finalUrl, notes: `HTTP ${code}` };
    }
    if (code === 403 || code === 429) {
      return { status: "blocked", finalUrl, notes: `HTTP ${code}` };
    }
    if (code >= 500) {
      return { status: "error", finalUrl, notes: `HTTP ${code}` };
    }
    return { status: "unknown", finalUrl, notes: `HTTP ${code}` };
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error ? e.message : String(e);
    if (/abort/i.test(msg)) {
      return { status: "timeout", finalUrl: url, notes: `timeout ${TIMEOUT_MS}ms` };
    }
    return { status: "error", finalUrl: url, notes: msg };
  }
}

/** Certaines origines ne répondent pas au HEAD : retenter en GET léger. */
async function probeImageUrlWithFallback(url: string): Promise<{
  status: string;
  finalUrl: string;
  notes: string;
}> {
  const head = await probeImageUrl(url);
  if (head.status === "ok" || head.status === "broken") {
    return head;
  }
  await beforeReq();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Range: "bytes=0-0",
        "User-Agent":
          "HealthyHub-ImageCheck/1.0 (+internal; npm run check:images)",
        Accept: "image/*,*/*;q=0.8",
      },
    });
    clearTimeout(timer);
    const code = res.status;
    const finalUrl = res.url || url;
    if (code >= 200 && code < 300) {
      return { status: "ok", finalUrl, notes: `GET HTTP ${code} (HEAD failed)` };
    }
    if (code === 404 || code === 410) {
      return { status: "broken", finalUrl, notes: `GET HTTP ${code}` };
    }
    return {
      status: head.status,
      finalUrl: head.finalUrl,
      notes: `HEAD: ${head.notes}; GET: HTTP ${code}`,
    };
  } catch (e) {
    clearTimeout(timer);
    return head;
  }
}

function rowForRestaurant(r: RestaurantListItem) {
  const source: Parameters<typeof getRestaurantImage>[0] = {
    id: r.id,
    name: r.name,
    slug: r.slug,
    image_url: r.image_url,
    category: r.category,
  };
  const resolved = getRestaurantImage(source);
  const raw = r.image_url?.trim() ?? "";
  const credible = isCredibleRestaurantImageUrl(r.image_url);
  const imageSource = credible ? "database_url" : "unsplash_pool";
  return {
    r,
    resolved,
    raw,
    credible,
    imageSource,
  };
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error(
      "[check-images] Variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY requises (.env.local)."
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, image_url, category")
    .order("name", { ascending: true });

  if (error) {
    console.error("[check-images]", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as RestaurantListItem[];
  console.log(
    `[check-images] ${rows.length} restaurant(s) — délai ${DELAY_MS}ms entre requêtes, timeout ${TIMEOUT_MS}ms\n`
  );

  const csv: string[] = [
    "name,slug,image_url_in_db,uses_credible_db_url,image_source_for_ui,resolved_url,http_status,final_url_after_redirect,notes",
  ];

  const tally: Record<string, number> = {};

  for (const r of rows) {
    const { resolved, raw, credible, imageSource } = rowForRestaurant(r);
    const result = await probeImageUrlWithFallback(resolved);
    tally[result.status] = (tally[result.status] ?? 0) + 1;

    const notes = [
      raw && !credible ? "URL base ignorée (non crédible ou placeholder)" : "",
      result.notes,
    ]
      .filter(Boolean)
      .join(" | ");

    console.log("—".repeat(64));
    console.log(`${r.name} (${r.slug ?? r.id})`);
    console.log(`  Source UI: ${imageSource}`);
    console.log(`  URL affichée: ${resolved.slice(0, 90)}${resolved.length > 90 ? "…" : ""}`);
    if (raw) {
      console.log(
        `  Base (brut):   ${raw.slice(0, 90)}${raw.length > 90 ? "…" : ""} → ${credible ? "utilisée" : "non utilisée"}`
      );
    }
    console.log(`  HTTP: ${result.status} — ${result.notes}`);
    if (result.finalUrl !== resolved) {
      console.log(`  URL finale: ${result.finalUrl.slice(0, 90)}…`);
    }

    csv.push(
      [
        csvEscape(r.name),
        csvEscape(r.slug ?? ""),
        csvEscape(raw),
        credible ? "yes" : "no",
        csvEscape(imageSource),
        csvEscape(resolved),
        csvEscape(result.status),
        csvEscape(result.finalUrl),
        csvEscape(notes),
      ].join(",")
    );
  }

  const out = path.resolve(process.cwd(), CSV_FILE);
  fs.writeFileSync(out, csv.join("\n"), "utf8");

  console.log("\n" + "—".repeat(64));
  console.log("[check-images] Synthèse HTTP (URL résolue / UI):");
  console.log(
    "  " +
      Object.entries(tally)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
  );
  console.log(`\n[check-images] CSV écrit : ${out}`);
}

main().catch((e) => {
  console.error("[check-images] Fatal:", e);
  process.exit(1);
});
