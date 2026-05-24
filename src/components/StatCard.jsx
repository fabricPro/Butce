export default function StatCard({ label, value, Icon, tone }) {
  const palette = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose:    'bg-rose-50 text-rose-700',
    amber:   'bg-amber-50 text-amber-700',
  }[tone] || 'bg-stone-100 text-stone-700';
  return (
    <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-3.5">
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${palette}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 font-bold text-stone-900 text-base sm:text-lg tabular-nums">
        {value}
      </div>
    </div>
  );
}
