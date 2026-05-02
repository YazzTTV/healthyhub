"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export default function EmailCapture() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">(
    "idle"
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || state === "loading") return;
    setState("loading");
    try {
      await trackEvent({
        event_name: "email_captured",
        metadata: { email, source: "landing_final_cta" },
      });
      setState("ok");
      setEmail("");
    } catch {
      setState("error");
    }
  };

  if (state === "ok") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-brand-light px-4 py-3 text-[13.5px] font-medium text-brand-deep animate-fade-up">
        <span aria-hidden>✓</span>
        Merci ! On t&apos;envoie les meilleurs spots dès qu&apos;ils sortent.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@email.com"
        className="h-12 flex-1 rounded-full border border-ink/10 bg-white px-5 text-[14px] text-ink placeholder:text-ink/40 shadow-soft transition focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20"
        aria-label="Adresse email"
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark hover:shadow-elevated active:translate-y-px disabled:opacity-60"
      >
        {state === "loading" ? "…" : "Recevoir les spots"}
      </button>
    </form>
  );
}
