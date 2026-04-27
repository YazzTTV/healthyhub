export default function DiscoverLoading() {
  return (
    <div className="-mb-10 -mt-10 -mx-5 sm:-mx-6 md:-mx-8 lg:-mx-10">
      <section className="relative h-[calc(100vh-5rem)] min-h-[680px] w-full overflow-hidden bg-cream">
        <div className="p-4 sm:p-6">
          <div className="h-28 animate-pulse rounded-3xl bg-white/70" />
          <div className="mt-4 h-[65vh] animate-pulse rounded-3xl bg-white/60" />
        </div>
      </section>
    </div>
  );
}
