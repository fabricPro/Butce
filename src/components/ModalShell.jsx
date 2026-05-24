import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

const SWIPE_DISMISS_THRESHOLD = 100; // px

export default function ModalShell({ title, onClose, children, footer }) {
  const sheetRef = useRef(null);
  const contentRef = useRef(null);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef(null);

  // Swipe-down to dismiss (mobile only — touch listeners only fire on touch screens).
  // Only initiates from the drag handle / header area to avoid hijacking form scrolling.
  const onTouchStart = (e) => {
    if (window.innerWidth >= 640) return; // sm+: centered modal, no drag
    dragStart.current = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (dragStart.current == null) return;
    const dy = e.touches[0].clientY - dragStart.current;
    if (dy > 0) setDragY(dy);
  };
  const onTouchEnd = () => {
    if (dragY > SWIPE_DISMISS_THRESHOLD) onClose();
    else setDragY(0);
    dragStart.current = null;
  };

  // Scroll focused inputs into view when virtual keyboard appears.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onFocus = (e) => {
      if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
      // Small delay lets iOS keyboard animation start before we scroll.
      setTimeout(() => {
        e.target.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 150);
    };
    el.addEventListener('focusin', onFocus);
    return () => el.removeEventListener('focusin', onFocus);
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-[fadein_120ms_ease-out]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[100svh] sm:max-h-[90vh] flex flex-col animate-[slideup_200ms_cubic-bezier(.2,.8,.2,1)]"
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
      >
        {/* Mobile drag handle + swipe-to-dismiss zone */}
        <div
          className="sm:hidden pt-2 pb-1 flex justify-center cursor-grab active:cursor-grabbing"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-10 h-1 rounded-full bg-stone-300" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200">
          <div className="font-semibold text-stone-800 text-base">{title}</div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] -mr-2 rounded-full hover:bg-stone-100 active:bg-stone-200 flex items-center justify-center transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={contentRef} className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
          {children}
        </div>

        {footer && (
          <div className="px-4 pt-3 pb-3 border-t border-stone-200 bg-white pb-safe">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadein { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideup { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @media (min-width: 640px) {
          @keyframes slideup { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        }
      `}</style>
    </div>
  );
}
