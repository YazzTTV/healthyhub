"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

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
      <div className="flex flex-wrap gap-3">
        {uberEatsUrl ? (
          <button
            type="button"
            onClick={() => handleOrderClick("ubereats", uberEatsUrl)}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-ink"
          >
            Uber Eats →
          </button>
        ) : null}
        {deliverooUrl ? (
          <button
            type="button"
            onClick={() => handleOrderClick("deliveroo", deliverooUrl)}
            className="inline-flex items-center gap-2 rounded-full bg-[#00CCBC] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
          >
            Deliveroo →
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
            <p className="text-lg font-semibold text-ink">Was this useful?</p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => sendFeedback("yes")}
                className="rounded-2xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => sendFeedback("no")}
                className="rounded-2xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => sendFeedback("need_more_restaurants")}
                className="rounded-2xl border border-ink/15 bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
              >
                Need more restaurants
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full text-center text-xs text-ink/60 hover:text-ink"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
