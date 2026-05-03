"use client";

import { useEffect, useState } from "react";
import {
  FILTERS,
  SORT_OPTIONS,
  type DiscoverFilter,
  type DiscoverSort,
} from "./constants";

function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold tracking-tight transition duration-250 ease-out-expo ${
        active
          ? "bg-ink text-white shadow-soft"
          : "bg-white text-ink/70 ring-1 ring-ink/[0.08] hover:text-ink hover:ring-ink/20"
      }`}
    >
      {children}
    </button>
  );
}

export type FiltersDraft = {
  search: string;
  filter: DiscoverFilter;
  sort: DiscoverSort;
};

type Props = {
  open: boolean;
  onClose: () => void;
  initialDraft: FiltersDraft;
  onApply: (draft: FiltersDraft) => void;
};

const DEFAULT_DRAFT: FiltersDraft = {
  search: "",
  filter: "Tous",
  sort: "Score healthy",
};

export default function DiscoverFiltersSheet({
  open,
  onClose,
  initialDraft,
  onApply,
}: Props) {
  const [draft, setDraft] = useState<FiltersDraft>(initialDraft);

  useEffect(() => {
    if (open) setDraft(initialDraft);
  }, [open, initialDraft]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => {
    setDraft(DEFAULT_DRAFT);
    onApply(DEFAULT_DRAFT);
    onClose();
  };

  const apply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Fermer les filtres"
        className="fixed inset-0 z-[1230] bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-[1240] flex max-h-[90vh] flex-col rounded-t-[28px] bg-white shadow-floating ring-1 ring-ink/[0.06] animate-fade-up lg:inset-auto lg:bottom-auto lg:left-auto lg:right-6 lg:top-[5rem] lg:max-h-[min(640px,90vh)] lg:w-full lg:max-w-lg lg:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-ink/15" aria-hidden />
        </div>

        <div className="border-b border-ink/[0.05] px-5 pb-3 pt-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
                Filtres
              </p>
              <h2 className="mt-0.5 text-[18px] font-semibold tracking-tighter-display text-ink">
                Affiner la carte
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink/[0.04] text-ink/70 transition hover:bg-ink/[0.07]"
              aria-label="Fermer"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="scrollbar-premium flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-4 sm:px-5">
          <div>
            <label htmlFor="discover-search" className="sr-only">
              Recherche
            </label>
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                id="discover-search"
                type="text"
                value={draft.search}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, search: e.target.value }))
                }
                placeholder="Chercher un spot, une cuisine, un quartier…"
                className="h-12 w-full rounded-full border border-ink/[0.08] bg-cream/80 pl-9 pr-4 text-[13.5px] text-ink placeholder:text-ink/40 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45">
              Catégories
            </p>
            <div className="scrollbar-none flex gap-2 overflow-x-auto pb-1">
              {FILTERS.map((filter) => (
                <FilterChip
                  key={filter}
                  active={draft.filter === filter}
                  onClick={() => {
                    setDraft((d) => ({ ...d, filter }));
                  }}
                >
                  {filter}
                </FilterChip>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="discover-sort"
              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink/45"
            >
              Tri
            </label>
            <select
              id="discover-sort"
              value={draft.sort}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sort: e.target.value as DiscoverSort,
                }))
              }
              className="h-12 w-full appearance-none rounded-full border border-ink/[0.08] bg-cream/80 px-4 pr-10 text-[13px] font-semibold text-ink/85 focus:border-brand/40 focus:outline-none"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23141b1f' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-ink/[0.05] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-ink ring-1 ring-ink/12 transition hover:bg-cream/80"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={apply}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-brand text-[13px] font-semibold text-white shadow-soft transition hover:bg-brand-dark"
          >
            Appliquer
          </button>
        </div>
      </div>
    </>
  );
}
