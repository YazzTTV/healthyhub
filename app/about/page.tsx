import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Méthodologie · HealthyHub",
  description:
    "Comment HealthyHub sélectionne et note les restaurants healthy : critères, équipe, transparence.",
};

const CRITERIA = [
  {
    n: "01",
    title: "Fraîcheur & sourcing",
    body: "Produits frais, ingrédients identifiables, sourcing local ou bio quand c'est possible. Le surgelé masqué et les sauces industrielles font perdre des points.",
  },
  {
    n: "02",
    title: "Équilibre nutritionnel",
    body: "Présence de légumes, céréales complètes, protéines maigres ou végétales. Macros cohérentes selon la catégorie (poké, salade, brunch, protein…).",
  },
  {
    n: "03",
    title: "Transparence menu",
    body: "Composition claire des plats, possibilité d'adapter (sans gluten, vegan, sauces à part). Plus le menu est lisible, plus le score monte.",
  },
  {
    n: "04",
    title: "Cohérence du positionnement",
    body: "Une adresse qui se dit healthy doit l'être dans 80% de sa carte, pas seulement sur 1 bowl. On pénalise les cartes opportunistes.",
  },
  {
    n: "05",
    title: "Visite & retours",
    body: "Quand on visite (badge « Vérifié »), on évalue qualité réelle, accueil et fidélité au pitch. Sinon on s'appuie sur les avis structurés et le menu publié.",
  },
];

const FAQ = [
  {
    q: "Le « Score healthy » est-il scientifique ?",
    a: "Non, et on ne prétend pas l'être. C'est un score éditorial fondé sur 5 critères qualitatifs (fraîcheur, équilibre, transparence menu, cohérence, retours terrain). On préfère être honnête : c'est une opinion informée, pas un calcul nutritionnel certifié.",
  },
  {
    q: "Comment un restaurant peut-il être référencé ?",
    a: "Référencement gratuit via /partners. On vérifie la carte, l'approche, les retours. Si le score est < 3,5 on ne référence pas — on n'a aucun intérêt à diluer la sélection.",
  },
  {
    q: "Êtes-vous payés par les restaurants ?",
    a: "Non sur le référencement. À terme on lancera des programmes premium (mise en avant, photos pro) clairement étiquetés. La sélection éditoriale ne sera jamais à vendre.",
  },
  {
    q: "Pourquoi pas d'avis utilisateur ?",
    a: "Les avis prendront leur place quand on aura assez d'utilisateurs réguliers pour qu'ils soient significatifs. En attendant on s'appuie sur les notes agrégées des plateformes existantes et notre propre évaluation.",
  },
];

export default function AboutPage() {
  return (
    <section className="space-y-24 py-10 md:space-y-32 md:py-16">
      <div className="mx-auto max-w-3xl space-y-7">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
          Méthodologie
        </span>
        <h1 className="text-[40px] font-semibold leading-[1.05] tracking-tighter-display text-ink md:text-[52px]">
          Comment on sélectionne
          <br />
          <span className="text-brand-dark">les spots healthy.</span>
        </h1>
        <p className="text-[16.5px] leading-relaxed text-ink-soft">
          HealthyHub n&apos;est pas un agrégateur. C&apos;est une sélection
          éditoriale. Un humain regarde chaque carte, chaque adresse, chaque
          retour terrain. On dit non à au moins 60% des candidats au
          référencement.
        </p>
        <p className="text-[16.5px] leading-relaxed text-ink-soft">
          Voici les 5 critères qu&apos;on applique, dans l&apos;ordre.
        </p>
      </div>

      {/* === CRITERIA === */}
      <div className="mx-auto max-w-4xl space-y-6">
        {CRITERIA.map((c) => (
          <article
            key={c.n}
            className="grid gap-4 rounded-[24px] bg-white p-6 shadow-soft ring-1 ring-ink/[0.06] md:grid-cols-[80px_1fr] md:gap-6 md:p-8"
          >
            <span className="text-[14px] font-semibold tracking-[0.12em] text-brand-deep">
              {c.n}
            </span>
            <div className="space-y-1.5">
              <h2 className="text-[18px] font-semibold tracking-tight text-ink">
                {c.title}
              </h2>
              <p className="text-[14px] leading-relaxed text-ink-soft">
                {c.body}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* === SCORE EXPLAINED === */}
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Le Score healthy
          </span>
          <h2 className="text-[30px] font-semibold leading-[1.06] tracking-tighter-display text-ink md:text-[40px]">
            Une note de 3,5 à 5,0.
          </h2>
        </div>
        <div className="overflow-hidden rounded-[24px] bg-white shadow-soft ring-1 ring-ink/[0.06]">
          {[
            { range: "4,7 — 5,0", label: "Référence", body: "Adresse iconique du healthy parisien. On y envoie sans hésiter." },
            { range: "4,3 — 4,6", label: "Solide", body: "Cuisine cohérente, exécution propre, recommandé." },
            { range: "3,9 — 4,2", label: "Correct", body: "Bon dépannage, sans plus. À voir selon l'envie." },
            { range: "3,5 — 3,8", label: "Acceptable", body: "Limite de notre sélection. Quelques compromis." },
          ].map((tier, idx) => (
            <div
              key={tier.range}
              className={`flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:gap-6 ${
                idx > 0 ? "border-t border-ink/[0.05]" : ""
              }`}
            >
              <span className="font-mono text-[13.5px] font-semibold text-brand-deep sm:w-32">
                {tier.range}
              </span>
              <span className="text-[14px] font-semibold text-ink sm:w-28">
                {tier.label}
              </span>
              <span className="text-[13.5px] text-ink-soft sm:flex-1">
                {tier.body}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[13px] text-ink-mute">
          Tout spot affiché sur HealthyHub est noté minimum 3,5. Sous ce seuil,
          on ne référence pas. C&apos;est notre seuil de qualité.
        </p>
      </div>

      {/* === VERIFIED BADGE === */}
      <div className="mx-auto max-w-3xl rounded-[28px] bg-brand-soft p-8 ring-1 ring-brand/15 sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
          </svg>
          Vérifié par HealthyHub
        </span>
        <h2 className="mt-4 text-[22px] font-semibold tracking-tight text-ink md:text-[26px]">
          Le badge qu&apos;on attribue après visite.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
          Les spots avec le badge « Vérifié » ont été testés en personne par
          notre équipe : on a goûté, observé l&apos;ambiance, vérifié la
          fraîcheur. C&apos;est notre niveau de confiance le plus fort.
        </p>
        <p className="mt-2 text-[13px] text-ink-mute">
          Tous les spots sans badge restent évalués sur la base des cartes,
          retours publics et critères ci-dessus.
        </p>
      </div>

      {/* === FAQ === */}
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Questions
          </span>
          <h2 className="text-[30px] font-semibold leading-[1.06] tracking-tighter-display text-ink md:text-[40px]">
            On vous doit la transparence.
          </h2>
        </div>
        <div className="overflow-hidden rounded-[24px] bg-white ring-1 ring-ink/[0.06]">
          {FAQ.map((item, idx) => (
            <details
              key={item.q}
              className={`group ${
                idx > 0 ? "border-t border-ink/[0.06]" : ""
              }`}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-[15px] font-semibold tracking-tight text-ink transition hover:bg-cream/40">
                {item.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-deep transition group-open:rotate-45">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="px-6 pb-5 text-[14px] leading-relaxed text-ink-soft">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>

      {/* === CONTACT === */}
      <div className="mx-auto max-w-2xl text-center text-[13.5px] text-ink-mute">
        Vous trouvez une info inexacte sur une fiche ? Un spot mal noté ? On
        veut savoir.{" "}
        <a
          href="mailto:hello@healthyhub.fr"
          className="font-semibold text-brand-dark hover:text-brand"
        >
          hello@healthyhub.fr
        </a>
        <p className="mt-6">
          <Link
            href="/discover"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-[14px] font-semibold text-white shadow-soft transition hover:bg-brand-dark"
          >
            Voir la sélection
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </p>
      </div>
    </section>
  );
}
