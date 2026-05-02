"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

const FIELD_BASE =
  "h-12 w-full rounded-2xl border border-ink/10 bg-white px-4 text-[14px] text-ink " +
  "placeholder:text-ink/40 transition focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20";

export default function PartnersForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[28px] bg-white p-7 shadow-elevated ring-1 ring-ink/[0.06] animate-fade-up">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-deep">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h3 className="text-[20px] font-semibold tracking-tight text-ink">
          Bien reçu, merci&nbsp;!
        </h3>
        <p className="text-[14px] text-ink-soft">
          On revient vers vous sous 48&nbsp;h avec les prochaines étapes
          du référencement.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-[28px] bg-white p-6 shadow-elevated ring-1 ring-ink/[0.06] sm:p-7"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        // eslint-disable-next-line no-console
        console.log("[partners] request", Object.fromEntries(formData.entries()));
        void trackEvent({
          event_name: "partner_form_submitted",
          metadata: Object.fromEntries(formData.entries()),
        });
        setSubmitted(true);
      }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
        Référencement gratuit
      </p>
      <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight text-ink">
        Parlez-nous de votre cuisine
      </h2>

      <div className="mt-6 grid gap-3.5">
        <label className="space-y-1.5">
          <span className="block text-[12px] font-semibold text-ink-soft">
            Nom du restaurant
          </span>
          <input
            required
            name="restaurant_name"
            placeholder="Ex. Wild & The Moon"
            className={FIELD_BASE}
          />
        </label>

        <label className="space-y-1.5">
          <span className="block text-[12px] font-semibold text-ink-soft">
            Email de contact
          </span>
          <input
            required
            type="email"
            name="contact_email"
            placeholder="vous@votre-resto.com"
            className={FIELD_BASE}
          />
        </label>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="block text-[12px] font-semibold text-ink-soft">
              Ville
            </span>
            <input
              required
              name="city"
              placeholder="Paris"
              className={FIELD_BASE}
            />
          </label>
          <label className="space-y-1.5">
            <span className="block text-[12px] font-semibold text-ink-soft">
              Site ou Instagram
            </span>
            <input
              name="social_or_website"
              placeholder="@votre_compte ou votre site"
              className={FIELD_BASE}
            />
          </label>
        </div>

        <label className="space-y-1.5">
          <span className="block text-[12px] font-semibold text-ink-soft">
            Votre angle healthy
          </span>
          <textarea
            name="message"
            rows={4}
            placeholder="Plats phares, approche, ingrédients, ce qui vous rend uniques…"
            className={`${FIELD_BASE} h-auto py-3.5`}
          />
        </label>
      </div>

      <button
        type="submit"
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark hover:shadow-elevated active:translate-y-px sm:w-auto"
      >
        Envoyer ma candidature
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>

      <p className="mt-4 text-[11.5px] text-ink-mute">
        Référencement gratuit · Réponse sous 48&nbsp;h · Aucun engagement.
      </p>
    </form>
  );
}
