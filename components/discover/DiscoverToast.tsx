"use client";

import { useEffect } from "react";

type Props = {
  message: string | null;
  onDismiss: () => void;
  autoDismissMs?: number;
  /** Classes Tailwind pour la position du bas (ex. au-dessus du carrousel mobile). */
  bottomClassName?: string;
};

export default function DiscoverToast({
  message,
  onDismiss,
  autoDismissMs = 4000,
  bottomClassName = "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:bottom-8 lg:bottom-6",
}: Props) {
  useEffect(() => {
    if (!message) return;
    const t = globalThis.setTimeout(() => {
      onDismiss();
    }, autoDismissMs);
    return () => globalThis.clearTimeout(t);
  }, [message, onDismiss, autoDismissMs]);

  if (!message) return null;

  return (
    <div
      role="status"
      className={`pointer-events-none fixed left-1/2 z-[1150] w-[min(100%,22rem)] -translate-x-1/2 px-4 ${bottomClassName}`}
    >
      <div className="pointer-events-auto rounded-2xl bg-ink px-4 py-3 text-center text-[12.5px] font-medium leading-snug text-white shadow-floating ring-1 ring-white/10">
        {message}
      </div>
    </div>
  );
}
