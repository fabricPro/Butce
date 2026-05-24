export default function Pill({ active, onClick, tone, children }) {
  const toneClass = !active
    ? 'bg-stone-100 text-stone-600 hover:bg-stone-200 active:bg-stone-300'
    : tone === 'emerald' ? 'bg-emerald-100 text-emerald-700'
    : tone === 'rose'    ? 'bg-rose-100 text-rose-700'
    :                      'bg-amber-100 text-amber-700';
  return (
    <button
      onClick={onClick}
      className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${toneClass}`}
    >
      {children}
    </button>
  );
}
