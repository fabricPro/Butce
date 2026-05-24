import { Inbox } from 'lucide-react';

/**
 * Friendly empty state. Optional Icon + CTA button.
 *
 * Props:
 *   text         primary message
 *   Icon         lucide icon component (defaults to Inbox)
 *   actionLabel  optional CTA button label
 *   onAction     optional CTA button callback
 */
export default function EmptyState({ text, Icon = Inbox, actionLabel, onAction }) {
  return (
    <div className="bg-white rounded-2xl shadow-card border border-stone-100 px-6 py-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm text-stone-600 max-w-xs mx-auto">{text}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 min-h-[40px] px-4 rounded-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-sm font-medium transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
