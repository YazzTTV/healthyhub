"use client";

import type { DiscoverGoal } from "./constants";
import { GOAL_SHORT_LABEL } from "./constants";

type Props = {
  spotCount: number;
  onLocate: () => void;
  onOpenFilters: () => void;
  filtersActiveCount: number;
  onOpenGoal: () => void;
  activeGoal: DiscoverGoal | null;
  onClearGoal: () => void;
};

export default function DiscoverTopBar({
  spotCount,
  onLocate,
  onOpenFilters,
  filtersActiveCount,
  onOpenGoal,
  activeGoal,
  onClearGoal,
}: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1200] px-3 pt-3 sm:px-4 sm:pt-4">
      <div className="pointer-events-auto mx-auto max-w-3xl">
        <div className="max-h-16 overflow-hidden rounded-[24px] bg-white/95 shadow-floating ring-1 ring-ink/[0.06] backdrop-blur-xl supports-[backdrop-filter]:bg-white/85">
          <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
            <div className="min-w-0 flex-1">
              <p className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-deep/80 sm:block">
                Carte healthy · Paris
              </p>
              <p className="truncate text-[13px] font-semibold tracking-tighter-display text-ink sm:text-[14px]">
                <span className="text-brand-deep/80 sm:hidden">Carte healthy · </span>
                {spotCount} spots autour de toi
              </p>
            </div>

            {activeGoal ? (
              <div className="flex min-w-0 max-w-[38%] shrink items-center gap-0.5 rounded-full bg-brand-light py-1 pl-2 pr-0.5 text-[10px] font-semibold text-brand-deep sm:max-w-none sm:gap-1 sm:py-1 sm:pl-2.5 sm:pr-1 sm:text-[11px]">
                <span className="truncate">
                  Objectif · {GOAL_SHORT_LABEL[activeGoal]}
                </span>
                <button
                  type="button"
                  onClick={onClearGoal}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-deep transition hover:bg-white/80"
                  aria-label="Retirer l’objectif"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={onLocate}
              aria-label="Me localiser"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink/70 transition hover:bg-brand-light hover:text-brand-dark"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onOpenFilters}
              className="relative inline-flex h-12 shrink-0 items-center justify-center rounded-full bg-ink/5 px-3 text-[12px] font-semibold text-ink/80 transition hover:bg-brand-light hover:text-brand-dark sm:min-w-[5.5rem]"
            >
              Filtres
              {filtersActiveCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white ring-2 ring-white">
                  {filtersActiveCount > 9 ? "9+" : filtersActiveCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onOpenGoal}
              className={`relative inline-flex h-12 max-w-[42vw] shrink-0 items-center justify-center rounded-full px-2.5 text-[11px] font-semibold transition sm:max-w-none sm:min-w-[7.5rem] sm:px-3 sm:text-[12px] ${
                activeGoal
                  ? "bg-brand text-white shadow-soft"
                  : "bg-ink/5 text-ink/75 hover:bg-brand-light hover:text-brand-dark"
              }`}
            >
              <span className="truncate sm:hidden">Objectif</span>
              <span className="hidden truncate sm:inline">
                Objectif du jour
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
