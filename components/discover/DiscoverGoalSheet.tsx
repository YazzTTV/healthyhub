"use client";

import { useEffect } from "react";
import {
  GOAL_DESCRIPTIONS,
  GOALS,
  type DiscoverGoal,
} from "./constants";
import { trackObjectiveSelection } from "@/lib/analytics";

type Props = {
  open: boolean;
  onClose: () => void;
  activeGoal: DiscoverGoal | null;
  onSelectGoal: (goal: DiscoverGoal | null) => void;
};

export default function DiscoverGoalSheet({
  open,
  onClose,
  activeGoal,
  onSelectGoal,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 z-[1240] bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-[1250] flex max-h-[85vh] flex-col rounded-t-[28px] bg-white shadow-floating ring-1 ring-ink/[0.06] animate-fade-up lg:inset-auto lg:bottom-auto lg:left-auto lg:right-6 lg:top-[5rem] lg:max-h-[min(560px,85vh)] lg:w-full lg:max-w-md lg:rounded-[28px]">
        <div className="flex shrink-0 justify-center pt-2 lg:hidden">
          <span className="h-1 w-10 rounded-full bg-ink/15" aria-hidden />
        </div>
        <div className="border-b border-ink/[0.05] px-5 pb-3 pt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-deep">
            Objectif du jour
          </p>
          <h2 className="mt-1 text-[18px] font-semibold tracking-tighter-display text-ink">
            Choisis ce qui colle à ta journée
          </h2>
          <p className="mt-1 text-[13px] text-ink/60">
            Tu pourras le retirer à tout moment depuis la barre du haut.
          </p>
        </div>

        <div className="scrollbar-premium flex-1 overflow-y-auto px-3 pb-6 pt-2 sm:px-4">
          <ul className="space-y-2">
            {GOALS.map((goal) => {
              const meta = GOAL_DESCRIPTIONS[goal];
              const selected = activeGoal === goal;
              return (
                <li key={goal}>
                  <button
                    type="button"
                    onClick={() => {
                      const prev = activeGoal;
                      const next = selected ? null : goal;
                      onSelectGoal(next);
                      if (next) {
                        trackObjectiveSelection({
                          objective_name: GOAL_DESCRIPTIONS[next].title,
                          objective_key: next,
                          previous_objective_name: prev
                            ? GOAL_DESCRIPTIONS[prev].title
                            : null,
                          previous_objective_key: prev,
                          source: "discover_goal_sheet",
                        });
                      }
                      onClose();
                    }}
                    className={`w-full rounded-[24px] border px-4 py-3.5 text-left transition ${
                      selected
                        ? "border-brand/40 bg-brand-light ring-1 ring-brand/25"
                        : "border-ink/[0.06] bg-white hover:border-brand/25 hover:bg-cream/80"
                    }`}
                  >
                    <p className="text-[14px] font-semibold tracking-tight text-ink">
                      {meta.title}
                    </p>
                    <p className="mt-1 text-[12.5px] leading-snug text-ink/65">
                      {meta.body}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
