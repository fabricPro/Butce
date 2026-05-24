/**
 * Icon-only button with a guaranteed 44×44 touch target (WCAG AA).
 * Use for row actions (edit, delete, toggle) and other compact controls.
 */
export default function IconButton({
  onClick,
  title,
  children,
  tone = 'neutral',     // 'neutral' | 'danger' | 'success'
  className = '',
}) {
  const toneClass =
    tone === 'danger'  ? 'text-rose-600 hover:bg-rose-50 active:bg-rose-100' :
    tone === 'success' ? 'text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100' :
                         'text-stone-600 hover:bg-stone-100 active:bg-stone-200';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg transition-colors ${toneClass} ${className}`}
    >
      {children}
    </button>
  );
}
