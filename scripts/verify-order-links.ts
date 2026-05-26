/**
 * Vérifie que chaque restaurant a un lien Commander valide côté frontend
 * (format URL + statut plateforme), comme le ferait getBestOrderLink().
 *
 * Usage: npm run verify:order-links
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";
import {
  getBestOrderLink,
  getValidatedDeliverooUrl,
  getValidatedUberEatsUrl,
  isValidDeliverooUrl,
  isValidUberEatsUrl,
} from "../lib/order-links";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

type Row = {
  id: string;
  name: string;
  slug: string | null;
  uber_eats_url: string | null;
  uber_eats_status: string | null;
  deliveroo_url: string | null;
  deliveroo_status: string | null;
};

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("[verify-order-links] Variables Supabase manquantes.");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id, name, slug, uber_eats_url, uber_eats_status, deliveroo_url, deliveroo_status"
    )
    .order("name");

  if (error) {
    console.error("[verify-order-links]", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as Row[];
  let commanderReady = 0;
  let rawButInvalid = 0;
  let noLinks = 0;
  const issues: string[] = [];

  for (const r of rows) {
    const best = getBestOrderLink(r);
    if (best) {
      commanderReady += 1;
      continue;
    }

    const hasRaw = Boolean(r.uber_eats_url || r.deliveroo_url);
    if (!hasRaw) {
      noLinks += 1;
      continue;
    }

    rawButInvalid += 1;
    const bits: string[] = [];
    if (r.uber_eats_url) {
      bits.push(
        `uber: url=${isValidUberEatsUrl(r.uber_eats_url) ? "ok" : "bad"} status=${r.uber_eats_status ?? "—"} validated=${getValidatedUberEatsUrl(r) ? "yes" : "no"}`
      );
    }
    if (r.deliveroo_url) {
      bits.push(
        `deliveroo: url=${isValidDeliverooUrl(r.deliveroo_url) ? "ok" : "bad"} status=${r.deliveroo_status ?? "—"} validated=${getValidatedDeliverooUrl(r) ? "yes" : "no"}`
      );
    }
    issues.push(`${r.name} (${r.slug ?? r.id}): ${bits.join(" | ")}`);
  }

  console.log(`[verify-order-links] ${rows.length} restaurants`);
  console.log(`  Commander OK:     ${commanderReady}`);
  console.log(`  Sans livraison:   ${noLinks}`);
  console.log(`  Liens invalides:  ${rawButInvalid}`);

  if (issues.length > 0) {
    console.log("\nExemples de liens bruts non utilisables par le CTA:");
    for (const line of issues.slice(0, 25)) {
      console.log(`  - ${line}`);
    }
    if (issues.length > 25) {
      console.log(`  … et ${issues.length - 25} autre(s)`);
    }
  }

  process.exit(rawButInvalid > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("[verify-order-links] Fatal:", e);
  process.exit(1);
});
