/** 3 cartes squelettes pendant le chargement du catalogue Discover. */
export default function DiscoverCatalogSkeleton() {
  return (
    <div className="space-y-2 px-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-ink/[0.06]"
        >
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-ink/[0.08]" />
          <div className="flex flex-1 flex-col gap-2 py-1">
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-ink/[0.08]" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-ink/[0.06]" />
            <div className="mt-auto h-7 w-full animate-pulse rounded-full bg-ink/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  );
}
