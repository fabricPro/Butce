export default function Pill({ active, onClick, tone, children }) {
  const toneClass = !active
    ? 'bg-stone-100 text-stone-600'
    : tone === 'emerald' ? 'bg-emerald-100 text-emerald-700'
    : tone === 'rose'    ? 'bg-rose-100 text-rose-700'
    :                      'bg-amber-100 text-amber-700';
  return (
    <button onClick={onClick} className={`px-3 py-1 rounded-full text-xs font-medium ${toneClass}`}>
      {children}
    </button>
  );
}
