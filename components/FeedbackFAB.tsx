"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "healthyhub:feedback_dismissed_at";
const COOLDOWN_DAYS = 7;

export default function FeedbackFAB() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHidden(false);
        return;
      }
      const ts = Number(raw);
      const days = (Date.now() - ts) / (1000 * 60 * 60 * 24);
      setHidden(days < COOLDOWN_DAYS);
    } catch {
      setHidden(false);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
    setHidden(true);
  };

  const send = (rating: "good" | "meh" | "bad", note?: string) => {
    void trackEvent({
      event_name: "discover_feedback",
      metadata: { rating, note: note ?? null },
    });
    setSubmitted(true);
    setTimeout(dismiss, 1800);
  };

  if (hidden) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-[1300] inline-flex h-12 items-center gap-2 rounded-full bg-ink px-4 text-[13px] font-semibold text-white shadow-floating ring-1 ring-white/10 transition duration-250 ease-out-expo hover:scale-[1.02] active:translate-y-px sm:bottom-6 sm:right-6"
          aria-label="Donner un avis"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="hidden sm:inline">Avis sur la carte</span>
          <span className="sm:hidden">Avis</span>
        </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[1400] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={dismiss}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-floating ring-1 ring-ink/[0.06] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {!submitted ? (
              <>
                <div className="px-6 pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                    30 secondes
                  </p>
                  <h3 className="mt-1.5 text-[20px] font-semibold tracking-tight text-ink">
                    La carte t&apos;aide&nbsp;à choisir&nbsp;?
                  </h3>
                  <p className="mt-1.5 text-[13.5px] text-ink-mute">
                    Tes retours nous aident à affiner la sélection.
                  </p>
                </div>
                <div className="grid gap-2 p-4">
                  <button
                    type="button"
                    onClick={() => send("good")}
                    className="flex h-12 items-center justify-between rounded-2xl bg-brand px-5 text-[14px] font-semibold text-white shadow-soft transition hover:bg-brand-dark"
                  >
                    <span>Oui, je trouve facilement</span>
                    <span aria-hidden>👍</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => send("meh")}
                    className="flex h-12 items-center justify-between rounded-2xl bg-white px-5 text-[14px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
                  >
                    <span>Bof, pas évident</span>
                    <span aria-hidden>🤔</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => send("bad")}
                    className="flex h-12 items-center justify-between rounded-2xl bg-white px-5 text-[14px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
                  >
                    <span>Il manque des choses</span>
                    <span aria-hidden>👎</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  className="block w-full border-t border-ink/[0.05] py-3.5 text-center text-[12.5px] font-medium text-ink-mute transition hover:bg-ink/[0.02]"
                >
                  Plus tard
                </button>
              </>
            ) : (
              <div className="px-6 py-8 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-brand-light text-brand-deep">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <p className="mt-3 text-[16px] font-semibold tracking-tight text-ink">
                  Merci, c&apos;est noté.
                </p>
                <p className="mt-1 text-[13px] text-ink-mute">
                  On affine la carte avec ton retour.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
