"use client";

import { useCallback, useState } from "react";

type Props = {
  /** URL absolue à copier ; sinon `window.location.href` au clic. */
  shareUrl?: string;
  className?: string;
};

export default function RestaurantShareButton({
  shareUrl: shareUrlProp,
  className = "",
}: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const copy = useCallback(async () => {
    const url =
      shareUrlProp?.trim() ||
      (typeof window !== "undefined" ? window.location.href : "");
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Lien copié dans le presse-papiers.");
    } catch {
      setToast("Copie impossible — copie le lien à la main.");
    }
    window.setTimeout(() => setToast(null), 3200);
  }, [shareUrlProp]);

  return (
    <div className={`relative inline-flex flex-col items-stretch ${className}`}>
      <button
        type="button"
        onClick={() => void copy()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-[13px] font-semibold text-ink ring-1 ring-ink/12 transition hover:ring-brand/35"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" x2="12" y1="2" y2="15" />
        </svg>
        Partager
      </button>
      {toast ? (
        <p
          role="status"
          className="absolute left-0 top-full z-20 mt-2 whitespace-nowrap rounded-2xl bg-ink px-3 py-2 text-[12px] font-medium text-white shadow-lg"
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}
