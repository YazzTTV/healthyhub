"use client";

type Props = {
  spotCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  children: React.ReactNode;
};

export default function DiscoverMobileTray({
  spotCount,
  expanded,
  onToggleExpanded,
  children,
}: Props) {
  if (!expanded) {
    return (
      <div className="absolute inset-x-0 bottom-0 z-[1000] flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="inline-flex h-12 min-w-[10rem] items-center justify-center gap-2 rounded-full bg-white/95 px-5 text-[13px] font-semibold text-ink shadow-floating ring-1 ring-ink/[0.06] backdrop-blur-xl supports-[backdrop-filter]:bg-white/88"
        >
          <span aria-hidden className="text-brand-deep">
            ↑
          </span>
          <span>
            {spotCount} spot{spotCount === 1 ? "" : "s"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1000] max-h-[min(52vh,420px)] lg:hidden">
      <div className="flex max-h-full flex-col rounded-t-[28px] bg-white/95 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-floating ring-1 ring-ink/[0.06] backdrop-blur-xl supports-[backdrop-filter]:bg-white/88">
        <div className="flex shrink-0 flex-col items-center gap-2 px-4 pb-2">
          <span
            className="h-1 w-12 rounded-full bg-ink/15"
            aria-hidden
          />
          <div className="flex w-full items-center justify-between gap-2">
            <p className="text-[11px] font-semibold text-ink/50">
              Balaye pour parcourir les spots
            </p>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="inline-flex h-12 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold text-brand-deep underline-offset-2 hover:underline"
            >
              Cacher la liste
            </button>
          </div>
        </div>
        <div className="scrollbar-premium max-h-[min(46vh,380px)] min-h-0 flex-1 overflow-y-auto px-3 pb-1">
          {children}
        </div>
      </div>
    </div>
  );
}
