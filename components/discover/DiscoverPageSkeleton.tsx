/** Skeleton affiché pendant le chargement RSC de /discover. */
export default function DiscoverPageSkeleton() {
  return (
    <div className="-mb-10 -mt-10 -mx-5 sm:-mx-6 md:-mx-8 lg:-mx-10">
      <section className="relative h-[calc(100vh-4rem)] min-h-[680px] w-full overflow-hidden bg-cream-deep">
        <div className="flex h-14 items-center justify-between gap-3 border-b border-ink/[0.06] bg-cream/90 px-4 backdrop-blur sm:px-6">
          <div className="h-9 w-32 animate-pulse rounded-full bg-white/80 ring-1 ring-ink/[0.06]" />
          <div className="flex gap-2">
            <div className="h-9 w-24 animate-pulse rounded-full bg-white/80 ring-1 ring-ink/[0.06]" />
            <div className="h-9 w-28 animate-pulse rounded-full bg-white/80 ring-1 ring-ink/[0.06]" />
          </div>
        </div>
        <div className="relative h-[calc(100%-3.5rem)] w-full animate-pulse bg-gradient-to-b from-brand-light/40 via-cream to-brand-light/30">
          <div className="absolute inset-8 rounded-[32px] bg-white/25 ring-1 ring-ink/[0.04]" />
          <div className="absolute bottom-8 left-1/2 flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2 rounded-[28px] bg-white/85 p-4 shadow-soft ring-1 ring-ink/[0.06] backdrop-blur-sm">
            <div className="h-4 w-3/4 rounded-full bg-ink/[0.08]" />
            <div className="h-3 w-1/2 rounded-full bg-ink/[0.06]" />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="mt-2 flex gap-3 rounded-2xl bg-white/60 p-2 ring-1 ring-ink/[0.04]"
              >
                <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-ink/[0.08]" />
                <div className="flex flex-1 flex-col justify-center gap-2">
                  <div className="h-3 w-4/5 animate-pulse rounded-full bg-ink/[0.08]" />
                  <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-ink/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
