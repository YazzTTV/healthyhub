/** Styles visuels partagés (placeholder, skeleton) par catégorie cuisine. */

export function gradientForCategory(category?: string | null): string {
  const value = (category ?? "").toLowerCase();
  if (value.includes("poke") || value.includes("salad") || value.includes("salade")) {
    return "from-[#e8f4ef] via-[#f2faf6] to-[#dceee6]";
  }
  if (value.includes("vegan")) return "from-[#eef7ef] via-[#f6fbf6] to-[#e8f2ea]";
  if (value.includes("protein")) return "from-[#eef1f6] via-[#f7f9fc] to-[#e8ecf2]";
  if (value.includes("brunch")) return "from-[#f8f1ea] via-[#fcf7f1] to-[#f1e7dc]";
  if (value.includes("matcha") || value.includes("juice")) {
    return "from-[#eef6f0] via-[#f4fbf7] to-[#e5f0ea]";
  }
  return "from-[#f3f0e8] via-[#faf7f1] to-[#ece7dd]";
}

export function categoryDisplayLabel(category?: string | null): string | null {
  const raw = category?.trim();
  if (!raw) return null;
  return raw;
}
