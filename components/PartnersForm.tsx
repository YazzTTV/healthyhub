"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function PartnersForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-3xl border border-brand/20 bg-brand-light p-6 text-brand-dark">
        Merci, on vous contacte rapidement.
      </div>
    );
  }

  return (
    <form
      className="grid gap-4 rounded-3xl bg-white p-6 ring-1 ring-ink/10"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        // MVP: on garde un submit simple sans backend.
        // eslint-disable-next-line no-console
        console.log("[partners] request", Object.fromEntries(formData.entries()));
        void trackEvent({
          event_name: "partner_form_submitted",
          metadata: Object.fromEntries(formData.entries()),
        });
        setSubmitted(true);
      }}
    >
      <input
        required
        name="restaurant_name"
        placeholder="Nom du restaurant"
        className="rounded-2xl border border-ink/15 px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
      <input
        required
        type="email"
        name="contact_email"
        placeholder="Email de contact"
        className="rounded-2xl border border-ink/15 px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
      <input
        required
        name="city"
        placeholder="Ville"
        className="rounded-2xl border border-ink/15 px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
      <input
        name="social_or_website"
        placeholder="Instagram ou site web"
        className="rounded-2xl border border-ink/15 px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
      <textarea
        name="message"
        rows={4}
        placeholder="Message"
        className="rounded-2xl border border-ink/15 px-4 py-3 text-sm focus:border-brand focus:outline-none"
      />
      <button
        type="submit"
        className="inline-flex w-fit rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Demander à être référencé
      </button>
    </form>
  );
}
