"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { trackUserHistory } from "@/lib/user-data";

type Props = {
  restaurantId: string;
  uberEatsUrl: string | null;
  deliverooUrl: string | null;
};

export default function OrderActions({
  restaurantId,
  uberEatsUrl,
  deliverooUrl,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOrderClick = (platform: "ubereats" | "deliveroo", url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    void trackEvent({
      event_name: "restaurant_order_clicked",
      restaurant_id: restaurantId,
      metadata: { platform },
    });
    void trackUserHistory(
      platform === "ubereats"
        ? "clicked_order_ubereats"
        : "clicked_order_deliveroo",
      restaurantId,
      { source: "restaurant_detail" }
    );
    setIsOpen(true);
  };

  const sendFeedback = (answer: "yes" | "no" | "need_more_restaurants") => {
    void trackEvent({
      event_name: "order_feedback",
      restaurant_id: restaurantId,
      metadata: { answer },
    });
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2.5">
        {uberEatsUrl ? (
          <button
            type="button"
            onClick={() => handleOrderClick("ubereats", uberEatsUrl)}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-black px-5 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-ink hover:shadow-elevated active:translate-y-px"
          >
            Uber Eats
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </button>
        ) : null}
        {deliverooUrl ? (
          <button
            type="button"
            onClick={() => handleOrderClick("deliveroo", deliverooUrl)}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-[#00CCBC] px-5 text-[14px] font-semibold text-white shadow-soft transition duration-250 ease-out-expo hover:bg-[#00b6a8] hover:shadow-elevated active:translate-y-px"
          >
            Deliveroo
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-[28px] bg-white shadow-floating ring-1 ring-ink/[0.06] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                Une question rapide
              </p>
              <h3 className="mt-1.5 text-[20px] font-semibold tracking-tight text-ink">
                Tu as trouvé ton bonheur&nbsp;?
              </h3>
              <p className="mt-1.5 text-[13.5px] text-ink-mute">
                On affine la sélection à partir de tes retours.
              </p>
            </div>
            <div className="grid gap-2 p-4">
              <button
                type="button"
                onClick={() => sendFeedback("yes")}
                className="flex h-12 items-center justify-between rounded-2xl bg-brand px-5 text-[14px] font-semibold text-white shadow-soft transition hover:bg-brand-dark"
              >
                <span>Oui, parfait</span>
                <span aria-hidden>✓</span>
              </button>
              <button
                type="button"
                onClick={() => sendFeedback("no")}
                className="flex h-12 items-center justify-between rounded-2xl bg-white px-5 text-[14px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
              >
                <span>Pas vraiment</span>
                <span aria-hidden>✕</span>
              </button>
              <button
                type="button"
                onClick={() => sendFeedback("need_more_restaurants")}
                className="flex h-12 items-center justify-between rounded-2xl bg-white px-5 text-[14px] font-semibold text-ink ring-1 ring-ink/10 transition hover:ring-brand/30"
              >
                <span>J&apos;aimerais plus de spots</span>
                <span aria-hidden>+</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="block w-full border-t border-ink/[0.05] py-3.5 text-center text-[12.5px] font-medium text-ink-mute transition hover:bg-ink/[0.02]"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
