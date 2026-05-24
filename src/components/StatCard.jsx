export default function StatCard({ label, value, Icon, tone }) {
  const palette = {
    emerald: 'bg-emerald-50 text-emerald-700',
    rose:    'bg-rose-50 text-rose-700',
    amber:   'bg-amber-50 text-amber-700',
  }[tone] || 'bg-stone-100 text-stone-700';
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-3">
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center ${palette}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-1.5 font-semibold text-stone-800 text-sm">{value}</div>
    </div>
  );
}
