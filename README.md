# HealthyHub

A minimal MVP that lists healthy restaurants and redirects users to Uber Eats or Deliveroo.

Stack: Next.js (App Router) · TypeScript · Tailwind CSS · Supabase.

## Pages

- `/` — Landing page
- `/discover` — Restaurant listing (reads from Supabase)
- `/restaurants/[id]` — Restaurant detail with Uber Eats / Deliveroo buttons

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project, then run `supabase/schema.sql` in the SQL editor.
3. Copy the env template and fill in your keys:
   ```bash
   cp .env.local.example .env.local
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Project layout

```
app/
  layout.tsx
  globals.css
  page.tsx                 # Landing
  discover/page.tsx        # Listing
  restaurants/[id]/page.tsx # Detail
components/
  Navbar.tsx
  RestaurantCard.tsx
lib/
  supabase.ts              # Supabase client
  types.ts                 # Restaurant types
supabase/
  schema.sql               # Table + RLS + seed
```

## Scope

Out of scope for the MVP: auth, payments, dashboards, admin panels, reviews.
The only job is to surface healthy restaurants and get users to Uber Eats or Deliveroo.
