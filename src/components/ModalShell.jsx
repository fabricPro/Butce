import { X } from 'lucide-react';

export default function ModalShell({ title, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/30 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <div className="font-semibold text-stone-800">{title}</div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100" aria-label="Kapat">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">{children}</div>
        {footer && <div className="p-4 border-t border-stone-200">{footer}</div>}
      </div>
    </div>
  );
}
