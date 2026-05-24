import { Trash2 } from 'lucide-react';

/** Shared footer used by every modal: optional delete (left), then Cancel + Save.
 *  Pass `saveLabel` to customize the primary action (e.g. "Aktar"). */
export default function ModalFooter({
  onClose, onSave, onDelete,
  saveLabel = 'Kaydet',
  cancelLabel = 'Vazgeç',
  deleteLabel = 'Sil',
}) {
  return (
    <div className="flex gap-2">
      {onDelete && (
        <button
          onClick={onDelete}
          className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm flex items-center gap-1"
        >
          <Trash2 className="w-4 h-4" /> {deleteLabel}
        </button>
      )}
      <button onClick={onClose} className="ml-auto px-3 py-2 rounded-lg bg-stone-100 text-sm">
        {cancelLabel}
      </button>
      <button onClick={onSave} className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm">
        {saveLabel}
      </button>
    </div>
  );
}
