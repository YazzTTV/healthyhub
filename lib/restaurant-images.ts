import type { RestaurantListItem } from "@/lib/types";
import {
  getRestaurantBrandProfile,
  type RestaurantBrandProfile,
} from "@/lib/restaurant-branding";

/**
 * Images restaurant : URL DB si crédible, sinon mapping nom/marque + pool diversifié déterministe.
 */

export type RestaurantImageSource = Pick<
  RestaurantListItem,
  "id" | "name" | "slug" | "image_url" | "category"
>;

const NON_CREDIBLE_FRAGMENTS = [
  "photo-1512621776951-a57141f2eefd",
  "via.placeholder",
  "placeholder",
  "picsum.photos",
];

function photo(path: string): string {
  return `https://images.unsplash.com/${path}?w=1400&auto=format&fit=crop&q=82`;
}

export function isCredibleRestaurantImageUrl(
  url: string | null | undefined
): boolean {
  if (url == null || typeof url !== "string") return false;
  const t = url.trim();
  if (!/^https:\/\//i.test(t)) return false;
  if (t.length < 28) return false;
  const lower = t.toLowerCase();
  return !NON_CREDIBLE_FRAGMENTS.some((frag) => lower.includes(frag));
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickStable(key: string, pool: readonly string[]): string {
  if (pool.length === 0) return "";
  return pool[hashString(key) % pool.length];
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* --- Pools thématiques (identité marque / ambiance), 12+ visuels distincts --- */

const POKE_PREMIUM = [
  photo("photo-1540189549336-e6e99c3679fe"),
  photo("photo-1553621042-f6e147245754"),
  photo("photo-1498837167922-ddd27525d352"),
  photo("photo-1610727365948-a652dffacfef"),
  photo("photo-1544947950-fa07a98d237f"),
  photo("photo-1626700055535-281bc989fae8"),
  photo("photo-1617196034183-421491e847fd"),
  photo("photo-1580822184713-fc540e57e832"),
  photo("photo-1596797038530-2c107229654b"),
  photo("photo-1617196034798-7f62f6bc6538"),
  photo("photo-1563379926898-05f4575a45d8"),
  photo("photo-1579584425555-c3ce17fd4351"),
  photo("photo-1515037028865-194a19645d27"),
  photo("photo-1625938145744-e380458618f5"),
];

const SALAD_LUNCH_COUNTER = [
  photo("photo-1546069901-ba9599a7e63c"),
  photo("photo-1490645935967-10de6ba17061"),
  photo("photo-1505576399279-565b52d4ac71"),
  photo("photo-1543339494-b4cd4f7ba686"),
  photo("photo-1547592180-85f173990554"),
  photo("photo-1543353071-087092ec393a"),
  photo("photo-1490645879346-f90227ebfe46"),
  photo("photo-1567620905732-2d1ec7ab7445"),
  photo("photo-1588137369433-e77607de7098"),
  photo("photo-1565299624946-b28f40a0ae38"),
  photo("photo-1590301157890-4810ed352733"),
  photo("photo-1568158879083-c9cda22bf403"),
  photo("photo-1476224203421-9ac39bcb3837"),
  photo("photo-1540189549336-e6e99c3679fe"),
];

const VEGAN_ORGANIC_CAFE = [
  photo("photo-1511690078903-71dc5a49f5e3"),
  photo("photo-1497034825429-c343d7c6a68f"),
  photo("photo-1505253758473-96b7015fcd40"),
  photo("photo-1610979802827-643082ae5187"),
  photo("photo-1540420773420-3366772f4999"),
  photo("photo-1615485290382-441e4d049cb5"),
  photo("photo-1466637524448-f675a94cedf5"),
  photo("photo-1546069901-eacef0df6022"),
  photo("photo-1604908176997-125f25cc6aa8"),
  photo("photo-1615484477778-d44e742be3e5"),
  photo("photo-1563822249548-9a02cf7ea06b"),
  photo("photo-1585238341988-f6d5ab35fe43"),
  photo("photo-1543339494-b4cd4f7ba686"),
  photo("photo-1490645935967-10de6ba17061"),
];

const URBAN_FAST_LUNCH = [
  photo("photo-1562967914-608f82629710"),
  photo("photo-1564678247558-066c6f8f28ce"),
  photo("photo-1565299507177-b0ac66763828"),
  photo("photo-1555939594-58d7cb561ad1"),
  photo("photo-1562967916-eb82221dfb92"),
  photo("photo-1598515213678-977e31cd1727"),
  photo("photo-1432139558310-84b37e903e2f"),
  photo("photo-1529042410759-befb1204b468"),
  photo("photo-1473093295043-cdd812d0e601"),
  photo("photo-1484723091739-30a097e8f929"),
  photo("photo-1596797038530-2c107229654b"),
  photo("photo-1610727365948-a652dffacfef"),
  photo("photo-1579584425555-c3ce17fd4351"),
  photo("photo-1544947950-fa07a98d237f"),
];

const JUICE_WELLNESS_BAR = [
  photo("photo-1622597463918-f23bd69e45f5"),
  photo("photo-1502741224143-90386d7f8c82"),
  photo("photo-1546173159-315922a31663"),
  photo("photo-1553530666-ca32f9d7ac29"),
  photo("photo-1534353420657-055f73ddae27"),
  photo("photo-1437418747212-8d9706afab22"),
  photo("photo-1513558168293-61983534e5dd"),
  photo("photo-1497534446932-c925b458314e"),
  photo("photo-1523677013519-69f7ce443de3"),
  photo("photo-1558642452-9d2a7deb7f62"),
  photo("photo-1481391319762-47c86f55e38e"),
  photo("photo-1623065423972-12840db301ed"),
  photo("photo-1610979802827-643082ae5187"),
  photo("photo-1498837167922-ddd27525d352"),
];

const PROTEIN_FITNESS = [
  photo("photo-1589308078059-023c6ad17605"),
  photo("photo-1623428187969-5aba2b541f07"),
  photo("photo-1532550907471-234f13ddc5e7"),
  photo("photo-1529193591184-b1d58069ecdd"),
  photo("photo-1467003909585-2f8a72700288"),
  photo("photo-1547592180-85f173990554"),
  photo("photo-1543353071-087092ec393a"),
  photo("photo-1617196034183-421491e847fd"),
  photo("photo-1604908176997-125f25cc6aa8"),
  photo("photo-1567620905732-2d1ec7ab7445"),
  photo("photo-1598515213678-977e31cd1727"),
  photo("photo-1540189549336-e6e99c3679fe"),
  photo("photo-1625938145744-e380458618f5"),
  photo("photo-1555939594-58d7cb561ad1"),
];

const CLEAN_BURGER = Array.from(
  new Set([
    photo("photo-1550547660-d9450f859349"),
    photo("photo-1568901346375-23c9450c58cd"),
    photo("photo-1586190848861-99aa4a171e90"),
    photo("photo-1553979459-b861f43e8f8e"),
    photo("photo-1594212694903-99d9cc9ed32c"),
    photo("photo-1561758033-c87a2e9d5f5e"),
    photo("photo-1548940742-60e44f368f48"),
    photo("photo-1550317138-10000687a72b"),
    photo("photo-1585238341988-f6d5ab35fe43"),
    photo("photo-1555992336-fb0dadcde176"),
    photo("photo-1596797038530-2c107229654b"),
    photo("photo-1546173159-315922a31663"),
    photo("photo-1562967914-608f82629710"),
    photo("photo-1473093295043-cdd812d0e601"),
  ])
);

const BRUNCH_HEALTHY = Array.from(
  new Set([
    photo("photo-1482049016688-2d3e1b311543"),
    photo("photo-1525351484163-7529414344d8"),
    photo("photo-1517433367423-c7e5b0f35086"),
    photo("photo-1504674900247-0877df9bb852"),
    photo("photo-1490645879346-f90227ebfe46"),
    photo("photo-1484723091739-30a097e8f929"),
    photo("photo-1432139558310-84b37e903e2f"),
    photo("photo-1478144597863-45552d80f36e"),
    photo("photo-1517248135467-4c7edcad34c4"),
    photo("photo-1533089860893-c05f44f01ab8"),
    photo("photo-1604908176997-125f25cc6aa8"),
    photo("photo-1555992097-b42ce07bd3ff"),
    photo("photo-1555992336-fb0dadcde176"),
    photo("photo-1498837167922-ddd27525d352"),
  ])
);

/** Fallback unique : grande diversité, indexée uniquement par identité stable du restaurant */
const DEFAULT_DIVERSE = Array.from(
  new Set([
    photo("photo-1546069901-ba9599a7e63c"),
    photo("photo-1540189549336-e6e99c3679fe"),
    photo("photo-1490645935967-10de6ba17061"),
    photo("photo-1547592180-85f173990554"),
    photo("photo-1543353071-087092ec393a"),
    photo("photo-1467003909585-2f8a72700288"),
    photo("photo-1482049016688-2d3e1b311543"),
    photo("photo-1498837167922-ddd27525d352"),
    photo("photo-1553621042-f6e147245754"),
    photo("photo-1511690078903-71dc5a49f5e3"),
    photo("photo-1505576399279-565b52d4ac71"),
    photo("photo-1543339494-b4cd4f7ba686"),
    photo("photo-1505253758473-96b7015fcd40"),
    photo("photo-1497034825429-c343d7c6a68f"),
    photo("photo-1610727365948-a652dffacfef"),
    photo("photo-1580822184713-fc540e57e832"),
    photo("photo-1596797038530-2c107229654b"),
    photo("photo-1563379926898-05f4575a45d8"),
    photo("photo-1579584425555-c3ce17fd4351"),
    photo("photo-1617196034183-421491e847fd"),
    photo("photo-1625938145744-e380458618f5"),
    photo("photo-1562967914-608f82629710"),
    photo("photo-1564678247558-066c6f8f28ce"),
    photo("photo-1622597463918-f23bd69e45f5"),
    photo("photo-1546173159-315922a31663"),
    photo("photo-1550547660-d9450f859349"),
    photo("photo-1568901346375-23c9450c58cd"),
    photo("photo-1525351484163-7529414344d8"),
    photo("photo-1517433367423-c7e5b0f35086"),
    photo("photo-1476224203421-9ac39bcb3837"),
    photo("photo-1437418747212-8d9706afab22"),
    photo("photo-1610979802827-643082ae5187"),
    photo("photo-1604908176997-125f25cc6aa8"),
    photo("photo-1565299624946-b28f40a0ae38"),
    photo("photo-1588137369433-e77607de7098"),
    photo("photo-1590301157890-4810ed352733"),
    photo("photo-1478144597863-45552d80f36e"),
    photo("photo-1517248135467-4c7edcad34c4"),
    photo("photo-1548940742-60e44f368f48"),
    photo("photo-1615485290382-441e4d049cb5"),
    photo("photo-1563822249548-9a02cf7ea06b"),
    photo("photo-1623428187969-5aba2b541f07"),
    photo("photo-1532550907471-234f13ddc5e7"),
    photo("photo-1585238341988-f6d5ab35fe43"),
    photo("photo-1615484477778-d44e742be3e5"),
    photo("photo-1490645879346-f90227ebfe46"),
    photo("photo-1565299507177-b0ac66763828"),
    photo("photo-1555939594-58d7cb561ad1"),
    photo("photo-1598515213678-977e31cd1727"),
    photo("photo-1544947950-fa07a98d237f"),
    photo("photo-1617196034798-7f62f6bc6538"),
    photo("photo-1515037028865-194a19645d27"),
    photo("photo-1484723091739-30a097e8f929"),
    photo("photo-1553979459-b861f43e8f8e"),
    photo("photo-1594212694903-99d9cc9ed32c"),
  ])
);

const POOL_BY_PROFILE: Record<RestaurantBrandProfile, readonly string[]> = {
  poke_chain: POKE_PREMIUM,
  salad_counter: SALAD_LUNCH_COUNTER,
  juice_bar: JUICE_WELLNESS_BAR,
  vegan_cafe: VEGAN_ORGANIC_CAFE,
  protein_kitchen: PROTEIN_FITNESS,
  clean_burger: CLEAN_BURGER,
  brunch_cafe: BRUNCH_HEALTHY,
  bakery_light: BRUNCH_HEALTHY,
  coffee_light: URBAN_FAST_LUNCH,
  asian_bowl: POKE_PREMIUM,
  mediterranean_healthy: SALAD_LUNCH_COUNTER,
  default_healthy: DEFAULT_DIVERSE,
};

/** Dernier recours si le pool et l’URL base échouent (Unsplash stable). */
export const RESTAURANT_IMAGE_ULTIMATE_FALLBACK = photo(
  "photo-1546069901-ba9599a7e63c"
);

/**
 * Image Unsplash déterministe (ignore image_url en base).
 * Utilisé en secours quand l’URL stockée ne charge pas.
 */
export function getRestaurantImageFromPool(r: RestaurantImageSource): string {
  const stableKey = [r.slug, r.name, r.id].filter(Boolean).join("|") || "healthyhub";
  const profile = getRestaurantBrandProfile({
    name: r.name,
    category: r.category,
    cuisine: null,
  });
  const pool = POOL_BY_PROFILE[profile] ?? DEFAULT_DIVERSE;
  return pickStable(`${stableKey}|${profile}`, pool);
}

export function getRestaurantImage(r: RestaurantImageSource): string {
  if (isCredibleRestaurantImageUrl(r.image_url)) {
    return r.image_url!.trim();
  }
  return getRestaurantImageFromPool(r);
}
