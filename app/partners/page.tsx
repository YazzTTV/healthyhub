import PartnersForm from "@/components/PartnersForm";
import PartnerPageTracker from "@/components/PartnerPageTracker";

export default function PartnersPage() {
  return (
    <section className="mx-auto grid max-w-4xl gap-8 py-6 md:grid-cols-2 md:py-12">
      <PartnerPageTracker />
      <div className="space-y-4">
        <span className="inline-flex items-center rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-dark">
          Partenaires
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-ink">
          Référencez votre restaurant healthy
        </h1>
        <p className="text-ink/70">
          Gagnez en visibilité auprès de clients qui veulent manger clean.
        </p>
      </div>
      <PartnersForm />
    </section>
  );
}
