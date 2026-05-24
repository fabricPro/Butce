import { Globe, RefreshCw, Info } from 'lucide-react';
import { formatNum } from '../../lib/format.js';

export default function Header({ setView, fx, onRefreshFx }) {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setView({ name: 'dashboard' })}
          className="font-semibold text-lg text-stone-800"
        >
          Bütçe
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <button
            onClick={onRefreshFx}
            className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center gap-1.5 text-stone-700"
            title="Kurları güncelle"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>USD {formatNum(fx.rates.USD, 2)} · EUR {formatNum(fx.rates.EUR, 2)}</span>
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            onClick={() => setView({ name: 'settings' })}
            className="px-2 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700"
            title="Ayarlar"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
