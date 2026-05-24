import {
  Plus, Activity, Wallet, Layers, Banknote, Repeat, Target,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Özet', Icon: Activity },
  { id: 'accounts', label: 'Hesap', Icon: Wallet },
  { id: 'transactions', label: 'İşlem', Icon: Layers },
  { id: 'loans', label: 'Kredi', Icon: Banknote },
  { id: 'recurring', label: 'Tekrar', Icon: Repeat },
  { id: 'budgets', label: 'Bütçe', Icon: Target },
];

export default function BottomNav({ view, setView, onQuickAdd }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 z-30 pb-safe">
      <div className="max-w-5xl mx-auto px-2 py-1.5 flex items-center gap-0.5">
        {TABS.map(t => {
          const active = view.name === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView({ name: t.id })}
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
              className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg transition-colors ${active ? 'text-amber-700 bg-amber-50' : 'text-stone-500 hover:text-stone-700 active:bg-stone-100'}`}
            >
              <t.Icon className="w-5 h-5 flex-shrink-0" />
              {/* Labels hide under 360px so each tab still has a 48px-tall icon-only touch target */}
              <span className="text-[10px] font-medium leading-none hidden min-[360px]:block">{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={onQuickAdd}
          aria-label="İşlem ekle"
          className="ml-1 w-12 h-12 rounded-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white flex items-center justify-center shadow transition-transform"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
