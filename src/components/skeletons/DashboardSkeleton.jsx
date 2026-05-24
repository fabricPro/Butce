import Skeleton from './Skeleton.jsx';

/**
 * Mirrors the real Dashboard layout so the page doesn't visibly "pop"
 * when data arrives.
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Hero card */}
      <section className="rounded-2xl bg-gradient-to-br from-amber-700 to-amber-600 p-5">
        <Skeleton className="h-3 w-20 bg-amber-500/40" />
        <Skeleton className="h-8 w-40 mt-2 bg-amber-500/40" />
        <Skeleton className="h-3 w-32 mt-1 bg-amber-500/40" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Skeleton className="h-9 rounded-xl bg-white/15" />
          <Skeleton className="h-9 rounded-xl bg-white/15" />
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl shadow-card border border-stone-100 p-3.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24 mt-2.5" />
          </div>
        ))}
      </section>

      {/* Chart placeholder */}
      <section className="bg-white rounded-2xl shadow-card border border-stone-100 p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <Skeleton className="h-64 w-full" />
      </section>

      {/* Two-column bottom */}
      <section className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-4">
          <Skeleton className="h-4 w-40 mb-3" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2 w-1/2 mt-1.5" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
