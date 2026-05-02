/**
 * Validates Uber Eats and Deliveroo URLs for all restaurants in Supabase.
 * Read-only: generates terminal report + restaurant-link-report.csv
 *
 * Usage: npm run check:links
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (e.g. in .env.local)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const REQUEST_GAP_MS = 500;
const FETCH_TIMEOUT_MS = 8000;
const REPORT_CSV = "restaurant-link-report.csv";

type CheckResult = {
  status: string;
  finalUrl: string;
  notes: string;
};

let requestIndex = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function beforeRequest(): Promise<void> {
  if (requestIndex > 0) {
    await sleep(REQUEST_GAP_MS);
  }
  requestIndex += 1;
}

function csvEscape(field: string): string {
  const s = field ?? "";
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Root or locale-only paths (no restaurant slug). */
function placeholderReason(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let u: URL;
  try {
    u = new URL(trimmed);
  } catch {
    return null;
  }
  const normalizedPath = u.pathname.replace(/\/+$/, "") || "/";
  if (normalizedPath === "/") {
    return "root_homepage_only";
  }
  const segments = normalizedPath.split("/").filter(Boolean);
  if (
    segments.length === 1 &&
    /^[a-z]{2}(-[a-z]{2})?$/i.test(segments[0])
  ) {
    return "locale_home_only";
  }
  return null;
}

function normalizeComparableUrl(u: string): string {
  try {
    const x = new URL(u);
    x.hash = "";
    if (x.pathname.endsWith("/") && x.pathname.length > 1) {
      x.pathname = x.pathname.replace(/\/+$/, "");
    }
    return x.href;
  } catch {
    return u;
  }
}

async function checkLink(raw: string | null): Promise<CheckResult> {
  if (raw == null || String(raw).trim() === "") {
    return { status: "missing", finalUrl: "", notes: "" };
  }

  const trimmed = String(raw).trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      status: "invalid",
      finalUrl: "",
      notes: "malformed URL",
    };
  }

  if (!/^https?:$/i.test(parsed.protocol)) {
    return {
      status: "invalid",
      finalUrl: "",
      notes: `unsupported protocol ${parsed.protocol}`,
    };
  }

  const placeholderNote = placeholderReason(trimmed);
  if (placeholderNote) {
    return {
      status: "placeholder",
      finalUrl: trimmed,
      notes: placeholderNote,
    };
  }

  await beforeRequest();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(trimmed, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "HealthyHub-LinkChecker/1.0 (+https://healthyhub; dev script)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    clearTimeout(timeout);

    const finalUrl = res.url || trimmed;
    const code = res.status;
    const server = res.headers.get("server") ?? "";
    const cfRay = res.headers.get("cf-ray") ?? "";

    const redirected =
      normalizeComparableUrl(finalUrl) !== normalizeComparableUrl(trimmed);

    if (code === 404 || code === 410) {
      return {
        status: "broken",
        finalUrl,
        notes: [redirected ? "redirect chain" : "", `HTTP ${code}`]
          .filter(Boolean)
          .join("; "),
      };
    }

    if (code === 403 || code === 429) {
      const hint =
        /cloudflare/i.test(server) || cfRay
          ? "blocked_or_bot_wall (Cloudflare?)"
          : "forbidden_or_rate_limited";
      return {
        status: "unverifiable",
        finalUrl,
        notes: [`HTTP ${code}`, hint].join("; "),
      };
    }

    if (code >= 500) {
      return {
        status: "unverifiable",
        finalUrl,
        notes: `HTTP ${code} server error`,
      };
    }

    if (code >= 200 && code < 400) {
      return {
        status: redirected ? "redirected" : "valid",
        finalUrl,
        notes: redirected
          ? `HTTP ${code}; arrived via redirect`
          : `HTTP ${code}`,
      };
    }

    return {
      status: "unverifiable",
      finalUrl,
      notes: `HTTP ${code}`,
    };
  } catch (e: unknown) {
    clearTimeout(timeout);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "This operation was aborted" || /abort/i.test(msg)) {
      return {
        status: "unverifiable",
        finalUrl: trimmed,
        notes: `timeout after ${FETCH_TIMEOUT_MS}ms`,
      };
    }
    return {
      status: "unverifiable",
      finalUrl: trimmed,
      notes: `network_error: ${msg}`,
    };
  }
}

type RestaurantRow = {
  id: string;
  name: string;
  slug: string | null;
  ubereats_url: string | null;
  deliveroo_url: string | null;
};

async function fetchAllRestaurants(
  supabase: SupabaseClient
): Promise<RestaurantRow[]> {
  const pageSize = 500;
  const out: RestaurantRow[] = [];
  let from = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, slug, ubereats_url, deliveroo_url")
      .order("name", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Supabase: ${error.message}`);
    }
    if (!data?.length) break;
    out.push(...(data as RestaurantRow[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return out;
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "[check-links] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
        "Set them in .env.local (see .env.local.example)."
    );
    process.exit(1);
  }

  const supabase = createClient(url, key);
  console.log("[check-links] Fetching restaurants…\n");

  let rows: RestaurantRow[];
  try {
    rows = await fetchAllRestaurants(supabase);
  } catch (e) {
    console.error(
      "[check-links] Failed to load restaurants:",
      e instanceof Error ? e.message : e
    );
    process.exit(1);
  }

  if (rows.length === 0) {
    console.log("[check-links] No restaurants found.");
    fs.writeFileSync(
      path.resolve(process.cwd(), REPORT_CSV),
      [
        "name,slug,ubereats_url,ubereats_status,ubereats_final_url,deliveroo_url,deliveroo_status,deliveroo_final_url,notes",
      ].join("\n"),
      "utf8"
    );
    return;
  }

  const csvLines: string[] = [
    "name,slug,ubereats_url,ubereats_status,ubereats_final_url,deliveroo_url,deliveroo_status,deliveroo_final_url,notes",
  ];

  console.log(
    `→ ${rows.length} restaurant(s). Checking links (${REQUEST_GAP_MS}ms between HTTP requests, ${FETCH_TIMEOUT_MS}ms timeout)…\n`
  );

  const tallyUber: Record<string, number> = {};
  const tallyDeliveroo: Record<string, number> = {};

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const uber = await checkLink(r.ubereats_url);
    const deliveroo = await checkLink(r.deliveroo_url);

    tallyUber[uber.status] = (tallyUber[uber.status] ?? 0) + 1;
    tallyDeliveroo[deliveroo.status] =
      (tallyDeliveroo[deliveroo.status] ?? 0) + 1;

    const rowNotes = [
      uber.notes && `Uber: ${uber.notes}`,
      deliveroo.notes && `Deliveroo: ${deliveroo.notes}`,
    ]
      .filter(Boolean)
      .join(" | ");

    console.log("—".repeat(72));
    console.log(`Restaurant: ${r.name}`);
    console.log(`  slug: ${r.slug ?? "(none)"}`);
    console.log(
      `  Uber Eats:    ${uber.status.padEnd(14)} ${uber.finalUrl ? `→ ${uber.finalUrl}` : r.ubereats_url || "(empty)"}`
    );
    if (uber.notes) console.log(`                (${uber.notes})`);
    console.log(
      `  Deliveroo:    ${deliveroo.status.padEnd(14)} ${deliveroo.finalUrl ? `→ ${deliveroo.finalUrl}` : r.deliveroo_url || "(empty)"}`
    );
    if (deliveroo.notes) console.log(`                (${deliveroo.notes})`);
    if (rowNotes) console.log(`  Notes: ${rowNotes}`);

    csvLines.push(
      [
        csvEscape(r.name),
        csvEscape(r.slug ?? ""),
        csvEscape(r.ubereats_url ?? ""),
        csvEscape(uber.status),
        csvEscape(uber.finalUrl),
        csvEscape(r.deliveroo_url ?? ""),
        csvEscape(deliveroo.status),
        csvEscape(deliveroo.finalUrl),
        csvEscape(rowNotes),
      ].join(",")
    );
  }

  const outPath = path.resolve(process.cwd(), REPORT_CSV);
  fs.writeFileSync(outPath, csvLines.join("\n"), "utf8");

  console.log("\n" + "—".repeat(72));
  console.log("[check-links] Summary — Uber Eats:");
  console.log(
    "  " +
      Object.entries(tallyUber)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
  );
  console.log("[check-links] Summary — Deliveroo:");
  console.log(
    "  " +
      Object.entries(tallyDeliveroo)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
  );
  console.log(`\n[check-links] Done. Wrote ${outPath}`);
}

main().catch((e) => {
  console.error("[check-links] Fatal:", e);
  process.exit(1);
});
