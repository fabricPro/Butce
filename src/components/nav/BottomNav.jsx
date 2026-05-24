import {
  Plus, Activity, Wallet, Layers, Banknote, Repeat, Target,
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Özet', Icon: Activity },
  { id: 'accounts', label: 'Hesaplar', Icon: Wallet },
  { id: 'transactions', label: 'İşlemler', Icon: Layers },
  { id: 'loans', label: 'Krediler', Icon: Banknote },
  { id: 'recurring', label: 'Tekrar', Icon: Repeat },
  { id: 'budgets', label: 'Bütçe', Icon: Target },
];

export default function BottomNav({ view, setView, onQuickAdd }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-200 z-30">
      <div className="max-w-5xl mx-auto px-2 py-2 flex items-center gap-1">
        {TABS.map(t => {
          const active = view.name === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setView({ name: t.id })}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg ${active ? 'text-amber-700 bg-amber-50' : 'text-stone-500 hover:text-stone-700'}`}
            >
              <t.Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          );
        })}
        <button
          onClick={onQuickAdd}
          className="ml-1 w-11 h-11 rounded-full bg-amber-600 text-white flex items-center justify-center shadow"
          title="İşlem ekle"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
