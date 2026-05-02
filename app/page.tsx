import DiscoverCTA from "@/components/DiscoverCTA";
import EmailCapture from "@/components/EmailCapture";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export const revalidate = 60;

type Stat = { value: string; label: string };

async function getLiveStats(): Promise<Stat[]> {
  // Fallback shown only if DB is unreachable. Conservative numbers.
  const fallback: Stat[] = [
    { value: "200+", label: "spots curatés" },
    { value: "12", label: "catégories" },
    { value: "20", label: "arrondissements" },
    { value: "4,5 ★", label: "note moyenne" },
  ];

  try {
    const [{ count: total }, { data: rows }] = await Promise.all([
      supabase
        .from("restaurants")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("restaurants")
        .select("category, city, rating, healthy_score")
        .limit(1000),
    ]);

    if (total == null || !rows) return fallback;

    const categories = new Set(
      rows
        .map((r) => (r.category as string | null)?.toLowerCase().trim())
        .filter(Boolean)
    );

    const arrondissements = new Set(
      rows
        .map((r) => {
          const city = (r.city as string | null) ?? "";
          const m = city.match(/(\d{1,2})\s*(?:e|er|ème|eme)?/);
          return m ? m[1] : null;
        })
        .filter(Boolean)
    );

    const ratings = rows
      .map((r) => Number(r.rating))
      .filter((n) => !Number.isNaN(n) && n > 0);

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;

    const totalRounded = total >= 50 ? `${Math.floor(total / 10) * 10}+` : `${total}`;

    return [
      { value: totalRounded, label: "spots curatés" },
      { value: `${categories.size}`, label: "catégories" },
      {
        value:
          arrondissements.size > 0 ? `${arrondissements.size}` : "20",
        label: "arrondissements",
      },
      {
        value: avgRating != null ? `${avgRating.toFixed(1).replace(".", ",")} ★` : "4,5 ★",
        label: "note moyenne",
      },
    ];
  } catch {
    return fallback;
  }
}

const STEPS = [
  {
    n: "01",
    title: "Localise-toi",
    body: "On capte ta position et on classe les spots les plus proches d'abord.",
  },
  {
    n: "02",
    title: "Définis ton objectif",
    body: "Perte de poids, prise de muscle ou manger clean. La carte se trie pour toi.",
  },
  {
    n: "03",
    title: "Choisis ton mode",
    body: "Sur place, à emporter ou livraison. On t'amène jusqu'à la porte du spot.",
  },
];

const CATEGORIES = [
  {
    label: "Poké",
    desc: "Bowls hawaïens",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop",
  },
  {
    label: "Salades",
    desc: "Frais & croquant",
    image:
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=900&auto=format&fit=crop",
  },
  {
    label: "Vegan",
    desc: "100% végétal",
    image:
      "https://images.unsplash.com/photo-1540914124281-342587941389?w=900&auto=format&fit=crop",
  },
  {
    label: "Brunch healthy",
    desc: "Sucré-salé clean",
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=900&auto=format&fit=crop",
  },
  {
    label: "Matcha & cafés",
    desc: "Pause healthy",
    image:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=900&auto=format&fit=crop",
  },
  {
    label: "Clean burger",
    desc: "Le burger qui fait du bien",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&auto=format&fit=crop",
  },
];

const PILLARS = [
  {
    title: "Score healthy par spot",
    body: "Chaque adresse est notée sur la qualité, la fraîcheur et l'équilibre. Tu sais ce que tu manges.",
  },
  {
    title: "Trié par objectif",
    body: "Perte de poids, prise de muscle, manger clean — la carte s'adapte à ce que tu veux pour ton corps.",
  },
  {
    title: "Multi-modes assumés",
    body: "Livraison, à emporter, sur place. On ne réduit pas un bon resto à une fiche de commande.",
  },
];

export default async function LandingPage() {
  const stats = await getLiveStats();
  return (
    <div className="space-y-24 pb-12 md:space-y-32 md:pb-20">
      {/* === HERO === */}
      <section className="grid items-center gap-12 pt-6 md:grid-cols-[1.05fr_1fr] md:gap-16 md:pt-10">
        <div className="space-y-7">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
            La carte healthy de Paris
          </span>

          <h1 className="text-[44px] font-semibold leading-[1.04] tracking-tighter-display text-ink sm:text-[56px] md:text-[64px]">
            Manger sain,
            <br />
            <span className="text-brand-dark">là où tu es.</span>
          </h1>

          <p className="max-w-[480px] text-[17px] leading-relaxed text-ink-soft">
            La carte des restaurants healthy bien notés autour de toi. Triée
            par objectif, distance et mode de service — pour décider en deux
            clics, sans tentation.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <DiscoverCTA />
            <Link
              href="/partners"
              className="inline-flex h-12 items-center justify-center rounded-full border border-ink/10 bg-white px-5 text-[14px] font-semibold text-ink shadow-soft transition duration-250 ease-out-expo hover:border-brand/30 hover:text-brand-dark active:translate-y-px"
            >
              Référencer mon restaurant
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-3 text-[12px] text-ink-mute">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-brand-deep">
                ✓
              </span>
              Distance &amp; score healthy
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-brand-deep">
                ✓
              </span>
              Filtré par objectif
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-brand-deep">
                ✓
              </span>
              Livraison, emporter ou sur place
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-brand-light shadow-floating ring-1 ring-ink/[0.06] md:aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1400&auto=format&fit=crop"
              alt="Bol healthy aux légumes frais"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-4 shadow-elevated ring-1 ring-ink/[0.06] backdrop-blur supports-[backdrop-filter]:bg-white/85">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand-deep">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold tracking-tight text-ink">
                    Pokawa Marais
                  </p>
                  <p className="text-[11.5px] text-ink-mute">
                    0,4 km · Score 4,7 · ★ 4,6 · Pause déj
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-brand/25 bg-brand-light px-2.5 py-1 text-[10px] font-semibold text-brand-deep">
                  Livraison &amp; emporter
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === STATS === */}
      <section>
        <div className="grid grid-cols-2 gap-3 rounded-[28px] bg-white p-6 shadow-soft ring-1 ring-ink/[0.06] sm:grid-cols-4 sm:gap-6 sm:p-10">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-1.5 text-center">
              <p className="text-[28px] font-semibold tracking-tighter-display text-ink sm:text-[34px]">
                {stat.value}
              </p>
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink-mute">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Comment ça marche
          </span>
          <h2 className="mx-auto max-w-2xl text-[34px] font-semibold leading-[1.06] tracking-tighter-display text-ink md:text-[44px]">
            Trois étapes, et c&apos;est plié.
          </h2>
          <p className="mx-auto max-w-md text-[15px] leading-relaxed text-ink-soft">
            Pas d&apos;app à installer. Pas de compte obligatoire. Juste une
            carte qui te répond vite.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-[24px] bg-white p-7 shadow-soft ring-1 ring-ink/[0.06]"
            >
              <span className="text-[12px] font-semibold tracking-[0.12em] text-brand-deep">
                {step.n}
              </span>
              <h3 className="mt-3 text-[20px] font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* === CATEGORIES === */}
      <section className="space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
              Catégories
            </span>
            <h2 className="text-[34px] font-semibold leading-[1.06] tracking-tighter-display text-ink md:text-[44px]">
              Le healthy, sous toutes ses formes.
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-ink-soft">
              Des bowls hawaïens aux brunchs sans gluten, on couvre les façons
              de bien manger en ville.
            </p>
          </div>
          <Link
            href="/discover"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-ink/10 bg-white px-5 text-[13px] font-semibold text-ink-soft shadow-soft transition hover:border-brand/30 hover:text-brand-dark md:self-end"
          >
            Voir toutes les catégories
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/discover"
              className="group relative block aspect-[4/5] overflow-hidden rounded-[24px] ring-1 ring-ink/[0.06] transition duration-250 ease-out-expo hover:-translate-y-0.5 hover:shadow-elevated md:aspect-[4/3]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image}
                alt={cat.label}
                className="h-full w-full object-cover transition duration-500 ease-out-expo group-hover:scale-[1.05]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent"
                aria-hidden
              />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="text-[16px] font-semibold tracking-tight text-white">
                  {cat.label}
                </p>
                <p className="text-[11.5px] text-white/75">{cat.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* === PILLARS === */}
      <section className="space-y-10">
        <div className="space-y-3 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Pourquoi HealthyHub
          </span>
          <h2 className="mx-auto max-w-2xl text-[34px] font-semibold leading-[1.06] tracking-tighter-display text-ink md:text-[44px]">
            Une carte, pas une app de commande.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[24px] bg-white p-7 shadow-soft ring-1 ring-ink/[0.06]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light text-brand-deep">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h3 className="mt-4 text-[18px] font-semibold tracking-tight text-ink">
                {pillar.title}
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* === PARTNERS STRIP === */}
      <section>
        <div className="overflow-hidden rounded-[32px] bg-brand-deep p-8 text-white shadow-floating sm:p-12 md:flex md:items-center md:gap-10">
          <div className="flex-1 space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
              Pour les restaurants
            </span>
            <h2 className="text-[28px] font-semibold leading-[1.1] tracking-tighter-display text-white md:text-[36px]">
              Faites partie de la sélection.
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-white/75">
              Une vitrine éditoriale pour les restaurants qui prennent soin de
              ce qu&apos;ils servent. Référencement gratuit, audience
              qualifiée, sans bruit.
            </p>
          </div>
          <Link
            href="/partners"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[14px] font-semibold text-ink shadow-soft transition hover:bg-cream md:mt-0"
          >
            Référencer mon restaurant
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
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="text-[34px] font-semibold leading-[1.05] tracking-tighter-display text-ink md:text-[48px]">
            Prêt à trouver ton prochain spot healthy&nbsp;?
          </h2>
          <p className="text-[16px] leading-relaxed text-ink-soft">
            La carte est ouverte. Toi, tu n&apos;as plus qu&apos;à choisir.
          </p>
          <div className="pt-2">
            <DiscoverCTA />
          </div>
        </div>
      </section>

      {/* === EMAIL CAPTURE === */}
      <section>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-[28px] bg-white p-8 text-center shadow-soft ring-1 ring-ink/[0.06] sm:p-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Newsletter
          </span>
          <h3 className="text-[22px] font-semibold tracking-tight text-ink md:text-[26px]">
            Les meilleurs nouveaux spots, dans ta boîte.
          </h3>
          <p className="max-w-md text-[14px] leading-relaxed text-ink-soft">
            Une fois par mois, sans spam. Que des adresses qu&apos;on a
            vraiment testées et validées.
          </p>
          <div className="w-full pt-1">
            <EmailCapture />
          </div>
        </div>
      </section>
    </div>
  );
}
