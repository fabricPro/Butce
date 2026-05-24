// Shared styling for text/number/date inputs and selects.
// Use the className constant for one-off cases where you need a raw element.

export const inputClass = 'w-full px-3 py-2 rounded-lg border border-stone-200 text-sm';

/** Drop-in <input> with consistent styling. */
export default function InputField({ className = '', ...props }) {
  return <input {...props} className={`${inputClass} ${className}`.trim()} />;
}

/** Drop-in <select> with consistent styling. */
export function SelectField({ className = '', children, ...props }) {
  return (
    <select {...props} className={`${inputClass} ${className}`.trim()}>
      {children}
    </select>
  );
}
