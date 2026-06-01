# HealthyHub — Trust × Usefulness Framework
**Role:** Head of Product · Head of Data Quality  
**Date:** June 1, 2026

---

## The Core Tension

The trust audit correctly identified fabrication. The over-correction removed useful, honest signals alongside the fake ones. The result: cards with accurate but empty content. Trustworthy but useless.

The framework below classifies every data point on two axes:
- **Source quality** (real DB value / reliable inference / fabrication)
- **Framing** (the language used when displaying it)

The rule is: **you can infer, but you must frame honestly.** "Riche en protéines" based on a real `protein_level` DB column is honest inference. "32g protéines" with no DB source is fabrication. The number format implies measurement precision that doesn't exist.

---

## The Three Tiers

### Tier 1 — Real data. Always show.
Direct database values, no computation involved. Display with full confidence and no hedging language.

| Field | Display rule |
|---|---|
| `name`, `city`, `category`, `cuisine` | Always |
| `tags[]` | Always, slice to 3 |
| `google_rating` + `google_review_count` | Always when present |
| `signature_dish_name` | When not null |
| `signature_dish_description` | When not null |
| `signature_dish_*` macros (all 4) | When all 4 present |
| `verified_by_healthyhub = true` | Badge only when explicit |
| Service flags (dine_in, takeaway, delivery) | When explicitly set |
| Delivery platform links | When present |
| `why_this_score`, `healthyhub_editor_note` | When present |
| `muscle_recovery_fit`, `lunch_light_fit`, etc. | Source for benefit tags |
| `healthy_score` (when ≠ 5.0 and within range) | Show as exact |

### Tier 2 — Reliable inference. Show with honest framing.
Derived from real DB columns through simple, auditable logic. The underlying data is real; the output is a qualitative interpretation. Frame as editorial ("Idéal pour") not behavioral ("Souvent choisi pour").

| Signal | Source | Display rule |
|---|---|---|
| Benefit tag "Idéal post-entraînement" | `muscle_recovery_fit = true` OR `protein_level = "high"` from DB | "Idéal pour ·" prefix |
| Benefit tag "Option légère" | `calorie_level = "low"` from DB | Same |
| Benefit tag "100% végétal" | `category` includes "vegan" | Same |
| Nutrition orientation chips | `protein_level`, `calorie_level`, `clean_level` from DB | Qualitative only: "Riche en protéines", "Peu calorique", "Très clean" |
| Healthy score (inferred) | `inferHealthyScoreFromAttributes()` when DB = 5.0/null | Show number, ScoreExplainer discloses methodology |
| "Idéal pour" in panel card | Category + fit flags | "Idéal pour X" not "Souvent choisi pour X" |
| Category calorie range | Category type | "~400–500 kcal" range only (never exact) |

### Tier 3 — Fabrication. Never show.
These create false impressions of precision or user behavior. No framing rescues them.

| Signal | Why it's unacceptable |
|---|---|
| `getSavedCount()` hash-generated save counts | Implies user behavior that doesn't exist |
| Exact dish names from `CATEGORY_DISH_POOL` | Implies specific menu knowledge we don't have |
| `isVerified()` from score + metadata heuristic | Implies editorial review that may not have happened |
| Exact macros (540 kcal / 32g / 58g / 14g) from category constants | Implies measurement that doesn't exist |
| "Souvent choisi pour X" from category heuristic | Implies behavioral data that doesn't exist |
| "Horaires à confirmer" shown universally | Creates a false expectation that we have hours when we don't |

---

## The Framing Rules

**Social claims** ("X sauvegardes", "Souvent choisi pour") require real behavioral data. Zero exceptions.

**Editorial claims** ("Idéal pour", "Riche en protéines") can be inferred from real DB attributes. These are HealthyHub's expert opinion, not user data.

**Nutritional data** — qualitative bands ("Riche en protéines", "Peu calorique") from real DB columns are honest. Exact numbers (grams, kcal) require a real menu source.

**Scores** — the healthy score inference is defensible because: (a) it is stable/deterministic per restaurant, (b) the ScoreExplainer discloses methodology, (c) it uses real attributes (category, nutrition bands) as inputs. The number can be shown; the methodology must be accessible.

**Dish names** — a dish name shown as "Plat phare · [name]" implies it exists on the menu. If it doesn't come from the DB, do not show a dish name. Show the cuisine type instead.

---

## Per-Feature Recommendations

### Signature dish
- `signature_dish_name` from DB → show as "Plat phare · [name]"
- No DB name → show cuisine/category type: "Poke bowl", "Salade composée"
- Never → invent a specific dish name from a pool

### Macros
- All 4 values in DB → show exact grid (current `MacrosTeaser`)
- Nutrition bands in DB but no exact macros → show qualitative orientation: "Riche en protéines · Peu calorique · Très clean"
- Category only, no bands → show category calorie range: "~400–500 kcal" with label "Estimation catégorie"
- Nothing → show nothing

### Healthy score
- Keep the exact number — it is defensible
- ScoreExplainer already links to methodology
- Add one sentence in ScoreExplainer when `why_this_score` is null: "Score estimé par HealthyHub sur la base du profil du lieu."
- Do not replace numbers with vague tiers ("Bon") — that removes useful differentiation without adding honesty

### Benefit tag / "Pourquoi"
- Priority 1: `muscle_recovery_fit`, `lunch_light_fit`, `focus_productivity_fit`, `pleasure_without_cracking_fit` → exact label
- Priority 2: `protein_level = "high"` → "Idéal post-entraînement"
- Priority 2: `calorie_level = "low"` → "Option légère"
- Priority 3: category "vegan" → "100% végétal", "poke" → "Riche en protéines", "salad" → "Pause déj légère", "brunch" → "Parfait le week-end"
- No match → show nothing (not "Spot équilibré")

### Social proof
- Google rating + review count → always show when present
- "Souvent choisi pour" → only with explicit DB flag
- Save counts → nothing until real data exists
- "Idéal pour" derived from nutrition profile → OK, clearly editorial

### Restaurant card information density
After these changes, a card with good DB coverage shows:
- Image + dish name overlay (if dish image)
- Score + city badge
- Restaurant name
- Rating (if Google data)
- Benefit tag (from DB flags or nutrition bands)
- Dish name (if in DB) + macro line (if in DB)
- Nutrition orientation chips (if nutrition bands in DB)
- Tags (if in DB)
- Service labels (if in DB)

A card with minimal DB coverage shows:
- Image
- Score
- Restaurant name
- Cuisine type label
- Nothing fabricated

Both states are honest. The first feels rich. The second feels sparse — which is the correct signal that this restaurant needs data enrichment, not that it should look identical to a well-documented one.

---

*Framework approved. Implementation follows in code.*
