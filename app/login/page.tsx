"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setStatus("sent");
  };

  const fieldClass =
    "h-12 w-full rounded-2xl border border-ink/10 bg-cream/80 px-4 text-[14px] text-ink " +
    "placeholder:text-ink/40 transition focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <section className="mx-auto max-w-md py-10 md:py-16">
      <div className="rounded-[28px] bg-white p-6 shadow-elevated ring-1 ring-ink/[0.06] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
          Compte
        </p>
        <h1 className="mt-1.5 text-[22px] font-semibold tracking-tight text-ink">
          Connecte-toi à HealthyHub
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          Garde tes spots préférés et retrouve où tu as exploré sur la carte.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          <label className="block space-y-1.5">
            <span className="text-[12px] font-semibold text-ink-soft">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton@email.com"
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex h-12 w-full items-center justify-center rounded-full bg-brand px-5 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-brand-dark hover:shadow-elevated active:translate-y-px disabled:opacity-70"
          >
            Recevoir mon lien de connexion
          </button>
        </form>

        {status === "sent" ? (
          <p className="mt-5 rounded-2xl bg-brand-light px-4 py-3 text-[14px] text-brand-dark ring-1 ring-brand/15">
            Lien envoyé. Vérifie ta boîte mail.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-[14px] text-red-700 ring-1 ring-red-200/80">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
}
