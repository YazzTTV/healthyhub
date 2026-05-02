import PartnersForm from "@/components/PartnersForm";
import PartnerPageTracker from "@/components/PartnerPageTracker";

const PROCESS = [
  {
    n: "01",
    title: "Vous nous parlez de votre cuisine",
    body: "Quelques infos clés sur votre adresse, votre approche healthy et votre ADN. 5 minutes max.",
  },
  {
    n: "02",
    title: "On vérifie & on met en page",
    body: "Notre équipe valide la qualité, photographie ou re-shoot vos plats si besoin, et rédige votre fiche premium.",
  },
  {
    n: "03",
    title: "Mise en avant locale",
    body: "Votre adresse apparaît sur la carte HealthyHub avec score, photos, plat phare et liens livraison.",
  },
];

const FAQ = [
  {
    q: "C'est combien ?",
    a: "Le référencement éditorial est gratuit. On gagne notre vie sur des programmes premium (mise en avant, événements) — uniquement si pertinent pour vous.",
  },
  {
    q: "Quels sont vos critères pour être référencé ?",
    a: "Approche healthy assumée (frais, équilibré, transparent), qualité des produits et cohérence avec une de nos catégories : poké, salades, vegan, brunch, bowls, protein, organic, matcha, prêt-à-manger ou clean burger.",
  },
  {
    q: "Combien de temps prend la mise en ligne ?",
    a: "Sous 7 jours en moyenne après réception de vos infos. On valide ensemble la fiche avant publication.",
  },
  {
    q: "Je suis déjà sur Uber Eats / Deliveroo, à quoi sert HealthyHub ?",
    a: "À toucher une audience qui ne cherche pas à commander n'importe quoi : elle filtre par objectif (perte de poids, prise de muscle, clean) et par mode de service. C'est un canal de découverte, pas un agrégateur de plus.",
  },
  {
    q: "Puis-je modifier ma fiche après publication ?",
    a: "Oui. Un espace partenaire est en cours, en attendant on met à jour pour vous en 24 h ouvrées.",
  },
];

const SIGNALS = [
  { value: "200+", label: "spots curatés" },
  { value: "48 h", label: "réponse moyenne" },
  { value: "0 €", label: "pour démarrer" },
];

export default function PartnersPage() {
  return (
    <section className="space-y-24 py-10 md:space-y-32 md:py-16">
      <PartnerPageTracker />

      {/* === HERO === */}
      <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[1fr_1.05fr] md:gap-16">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            Pour les restaurants
          </span>
          <h1 className="text-[40px] font-semibold leading-[1.05] tracking-tighter-display text-ink md:text-[52px]">
            Faites découvrir
            <br />
            <span className="text-brand-dark">votre cuisine healthy.</span>
          </h1>
          <p className="max-w-md text-[16px] leading-relaxed text-ink-soft">
            HealthyHub aide les gens à trouver vite des spots healthy autour
            d&apos;eux — pas seulement pour commander en ligne. Votre cuisine
            mérite d&apos;être visible là où les bonnes adresses comptent.
          </p>

          <ul className="space-y-3 pt-2">
            {[
              "Une audience qui cherche des spots healthy à proximité",
              "Distance, score healthy, avis et « pourquoi ce lieu » mis en avant",
              "Liens livraison ou résa quand c'est disponible — sans vous réduire à une app de commande",
              "Visibilité dans la carte locale HealthyHub",
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-[14px] text-ink-soft"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-deep">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-3 text-[12px] text-ink-mute">
            {SIGNALS.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-2">
                <span className="text-[16px] font-semibold text-ink">
                  {s.value}
                </span>
                <span>{s.label}</span>
              </span>
            ))}
          </div>
        </div>

        <PartnersForm />
      </div>

      {/* === PROCESS === */}
      <div className="mx-auto max-w-5xl space-y-10">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Comment ça marche
          </span>
          <h2 className="text-[30px] font-semibold leading-[1.06] tracking-tighter-display text-ink md:text-[40px]">
            Trois étapes, sans paperasse.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PROCESS.map((step) => (
            <div
              key={step.n}
              className="rounded-[24px] bg-white p-7 shadow-soft ring-1 ring-ink/[0.06]"
            >
              <span className="text-[12px] font-semibold tracking-[0.12em] text-brand-deep">
                {step.n}
              </span>
              <h3 className="mt-3 text-[18px] font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* === FAQ === */}
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Questions fréquentes
          </span>
          <h2 className="text-[30px] font-semibold leading-[1.06] tracking-tighter-display text-ink md:text-[40px]">
            Tout ce qu&apos;on nous demande.
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
        <p className="text-center text-[12.5px] text-ink-mute">
          Une autre question&nbsp;?{" "}
          <a
            href="mailto:partners@healthyhub.fr"
            className="font-semibold text-brand-dark hover:text-brand"
          >
            partners@healthyhub.fr
          </a>
        </p>
      </div>
    </section>
  );
}
