# Audit pipeline images — HealthyHub

Dernière exécution : `npm run audit:images`

## Base de données (Supabase)

| Champ | Existe en DB | Rempli (365 restos) | Utilisable UI |
|-------|--------------|---------------------|---------------|
| `signature_dish_image_url` | Oui | 132 | 127 |
| `restaurant_image_url` | **Non** | 0 | 0 |
| `restaurant_interior_image_url` | **Non** | 0 | 0 |
| `storefront_image_url` | **Non** | 0 | 0 |
| `image_url` (legacy) | Oui | 150 | 149 |
| `cover_image_url` | Non / vide | 0 | 0 |

Le SELECT applicatif retombe en mode **LEGACY** (colonnes dédiées absentes).

## Rendu frontend

| Métrique | Valeur |
|----------|--------|
| Total restaurants | 365 |
| Hero avec image (`getRestaurantImage`) | ~159 (43,6 %) |
| Placeholder | ~206 (56,4 %) |
| Au moins une URL brute en base | 164 |
| URL en base mais filtrée → placeholder | ~5 |

### Sources hero utilisées

1. `signature_dish_image_url` — majoritaire
2. `image_url` — repli legacy
3. Dernier recours (ex. manuscdn) — si aucune URL « propre »

### Hiérarchie implémentée (`lib/restaurant-images.ts`)

1. `signature_dish_image_url`
2. `restaurant_image_url`
3. `restaurant_interior_image_url`
4. `storefront_image_url`
5. `image_url`
6. `cover_image_url`
7. Dernier recours https (manuscdn, etc.)
8. Placeholder premium

### Causes principales sans image

1. **Aucune URL en base** (~201 restos) — ex. Soft Lunch Paris (`image_status: MISSING`)
2. **Chemins locaux invalides** — `/home/ubuntu/upload/...` (imports batch)
3. **URLs rejetées** — fragments `placeholder`, `industrial`, etc.
4. **Colonnes dédiées non migrées** — `restaurant_image_url` etc. inexistantes

### Frontend

- `RestaurantImage` : cascade multi-URL + repli `<img>` natif si `next/image` échoue
- `next.config.mjs` : `remotePatterns` `https://**` — OK
- Placeholder : icône catégorie + cuisine + « Photo non disponible »

## Objectif 90 %

Impossible uniquement côté frontend : **~201 restaurants n’ont aucune URL** en base. Il faut enrichir Supabase (scraping, Google Places, upload manuel) et migrer les colonnes `restaurant_image_url`, `storefront_image_url`, etc.

## Commandes

```bash
npm run audit:images    # stats champs + hiérarchie
npm run check:images    # sonde HTTP des URLs affichées
```
