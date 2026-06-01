/**
 * Renseigne `signature_dish_image_url` à partir des meilleures URLs « plat » déjà en base.
 * Nécessite SUPABASE_SERVICE_ROLE_KEY dans .env.local (écriture).
 *
 * Usage: npm run populate:signature-images
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";
import {
  isSyntheticPlaceholderImageUrl,
  normalizeRestaurantImageStatus,
  resolveHttpsImageUrl,
  type RestaurantImageStatus,
} from "@/lib/restaurant-images";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const DISH_SOURCE_STATUSES: RestaurantImageStatus[] = [
  "VERIFIED_EXACT",
  "VERIFIED_BRAND",
  "PLATFORM_IMAGE",
  "PREMIUM_FALLBACK",
];

function bestDishSourceUrl(row: {
  image_url: string | null;
  image_status: string | null;
}): string | null {
  const status = normalizeRestaurantImageStatus(row.image_status);
  const url = row.image_url?.trim();
  if (!url || isSyntheticPlaceholderImageUrl(url)) return null;
  if (!status || !DISH_SOURCE_STATUSES.includes(status)) return null;
  return resolveHttpsImageUrl(url) ?? (/^https:\/\//i.test(url) ? url : null);
}

async function main(): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error(
      "[populate-signature-images] NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis."
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, image_url, image_status, signature_dish_image_url");

  if (error) {
    console.error("[populate-signature-images]", error.message);
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;
  let noSource = 0;

  for (const row of data ?? []) {
    if (row.signature_dish_image_url?.trim()) {
      skipped += 1;
      continue;
    }
    const source = bestDishSourceUrl(row);
    if (!source) {
      noSource += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("restaurants")
      .update({ signature_dish_image_url: source })
      .eq("id", row.id);

    if (updateError) {
      console.error(`[populate] ${row.name}: ${updateError.message}`);
      continue;
    }
    updated += 1;
    console.log(`✓ ${row.name} → signature_dish_image_url`);
  }

  console.log(
    `\n[populate-signature-images] ${updated} mis à jour, ${skipped} déjà renseignés, ${noSource} sans source food, ${data?.length ?? 0} total.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
