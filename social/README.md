# HealthyHub · Brand kit Instagram

Tous les assets visuels pour lancer le compte Instagram dans la charte HealthyHub.

## Contenu

| Fichier | Format | Usage |
|---|---|---|
| `logo-profile.svg` | 1080×1080 | Avatar Instagram (cropé en cercle) |
| `logo-mark.svg` | 320×80 | Wordmark horizontal — overlay, signature |
| `post-01-manifesto.svg` | 1080×1350 (4:5) | Post manifeste · "Manger sain, sans y passer 20 minutes." |
| `post-02-map.svg` | 1080×1350 | Map teaser · "Paris, 12h32. Tu as 45 min." |
| `post-03-pick.svg` | 1080×1350 | Format récurrent Pick du jour |
| `post-04-lean.svg` | 1080×1350 | Sélection Lean & Light top 5 |
| `post-06-stat.svg` | 1080×1350 | Chiffre éditorial — 73% |
| `index.html` | — | Preview navigateur de tous les assets |

## Aperçu

Ouvre `social/index.html` dans ton navigateur pour voir tous les assets en grille avec liens de téléchargement.

```bash
# Mac
open social/index.html

# Linux
xdg-open social/index.html
```

## Exporter en PNG (pour Instagram)

Instagram veut du PNG/JPG. Les SVG sont vectoriels — tu choisis la résolution.

### Option 1 — Figma (recommandé)
1. Importe le SVG dans Figma
2. Sélectionne le frame
3. Export → PNG @1x (1080px déjà natif)

### Option 2 — Outil en ligne (rapide)
- [CloudConvert](https://cloudconvert.com/svg-to-png) — upload SVG, output 1080×1350
- [SVG2PNG](https://svgtopng.com/) — drag & drop

### Option 3 — CLI (batch)
```bash
# Installer rsvg-convert
brew install librsvg

# Exporter un fichier
rsvg-convert post-01-manifesto.svg -w 1080 -h 1350 -o post-01-manifesto.png

# Batch tous les posts
for f in post-*.svg; do
  rsvg-convert "$f" -w 1080 -h 1350 -o "${f%.svg}.png"
done

# Logo profile en 1080×1080
rsvg-convert logo-profile.svg -w 1080 -h 1080 -o logo-profile.png
```

### Option 4 — Inkscape
```bash
inkscape post-01-manifesto.svg --export-type=png --export-width=1080
```

## Charte de marque rappel

| Token | Hex | Usage |
|---|---|---|
| `brand-deep` | `#1F4A36` | Texte fort, fond logo, headlines accent |
| `brand` | `#2F6D4E` | Accents, pins, dots, wordmark "Hub" |
| `cream` | `#FAF7F0` | Fond principal des posts |
| `ink` | `#141B1F` | Texte principal sur cream |
| `ink-soft` | `#3A4549` | Texte secondaire |
| `ink-mute` | `#6B757A` | Labels uppercase, fine print |
| `leaf` | `#86EFAC` | Touche décorative mint, accents |

**Typo** : Inter (web), fallback Helvetica Neue. Toujours `letter-spacing: -2% à -3%` sur les titres display, `weight 600`.

## Format Instagram natif

- **Profile picture** : 1080×1080 (Instagram crop circulaire — garder le sujet centré dans un cercle inscrit de 880px)
- **Feed post portrait** : 1080×1350 (ratio 4:5) — **recommandé**, occupe plus de feed
- **Feed post carré** : 1080×1080 (1:1) — fallback
- **Reels / Story** : 1080×1920 (9:16) — à créer ultérieurement

## Bonnes pratiques de publication

1. **Toujours en PNG** (pas JPG) pour préserver les textes nets sur cream
2. Compresser via [TinyPNG](https://tinypng.com/) avant upload (gain 50-70% sans perte visible)
3. Premier slide d'un carrousel = hook, donc soigner la lisibilité mobile (titre ≥ 100px)
4. Tester en preview Instagram avant publication — la zone "safe" évite les coins
