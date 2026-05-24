/**
 * Shared shimmer primitive. All skeleton components compose this.
 * Uses Tailwind's animate-pulse for the breathing effect.
 */
export default function Skeleton({ className = '' }) {
  return <div className={`bg-stone-200 rounded animate-pulse ${className}`} />;
}
