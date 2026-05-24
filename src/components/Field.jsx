export default function Field({ label, children, hint }) {
  return (
    <div>
      <label className="text-xs font-medium text-stone-600">{label}</label>
      <div className="mt-1">{children}</div>
      {hint && <div className="text-[11px] text-stone-500 mt-1">{hint}</div>}
    </div>
  );
}
