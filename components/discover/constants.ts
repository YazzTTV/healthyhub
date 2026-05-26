export const FILTERS = [
  "Tous",
  "Mes favoris",
  "Poke",
  "Salade",
  "Vegan",
  "Protein",
  "Brunch",
  "Coups de cœur",
] as const;

export const SORT_OPTIONS = ["Plus proches", "Mieux notés", "Score healthy"] as const;

export const GOALS = ["Perte de poids", "Prise de muscle", "Manger clean"] as const;

export type DiscoverFilter = (typeof FILTERS)[number];
export type DiscoverSort = (typeof SORT_OPTIONS)[number];
export type DiscoverGoal = (typeof GOALS)[number];

export const GOAL_SHORT_LABEL: Record<DiscoverGoal, string> = {
  "Perte de poids": "Lean & Light",
  "Prise de muscle": "Muscle & recovery",
  "Manger clean": "Clean & reset",
};

export const GOAL_DESCRIPTIONS: Record<
  DiscoverGoal,
  { title: string; body: string }
> = {
  "Perte de poids": {
    title: "Perte de poids",
    body: "Repères plus légers, volumes maîtrisés et options équilibrées pour rester dans ton déficit sans te frustrer.",
  },
  "Prise de muscle": {
    title: "Prise de muscle",
    body: "Focus protéines et repas soutenus pour la récupération — bowls, bowls protéinés et adresses qui calent bien.",
  },
  "Manger clean": {
    title: "Manger clean",
    body: "Qualité des ingrédients, cuissons simples et menus qui mettent les produits bruts au centre.",
  },
};
