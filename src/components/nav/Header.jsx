import { Globe, RefreshCw, Info } from 'lucide-react';
import { formatNum } from '../../lib/format.js';

export default function Header({ setView, fx, onRefreshFx }) {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 pt-safe">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 flex items-center gap-2">
        <button
          onClick={() => setView({ name: 'dashboard' })}
          className="font-semibold text-base sm:text-lg text-stone-800 min-h-[40px] px-1"
        >
          Bütçe
        </button>
        <div className="ml-auto flex items-center gap-1.5 text-xs">
          <button
            onClick={onRefreshFx}
            className="min-h-[40px] px-2.5 sm:px-3 rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 flex items-center gap-1 sm:gap-1.5 text-stone-700 transition-colors"
            title="Kurları güncelle"
            aria-label={`USD ${formatNum(fx.rates.USD, 2)}, EUR ${formatNum(fx.rates.EUR, 2)}, güncelle`}
          >
            <Globe className="w-3.5 h-3.5 flex-shrink-0" />
            {/* Compact on narrow screens: "$32.40 · €35.20"; full text from sm: up. */}
            <span className="tabular-nums whitespace-nowrap">
              <span className="sm:hidden">${formatNum(fx.rates.USD, 2)} · €{formatNum(fx.rates.EUR, 2)}</span>
              <span className="hidden sm:inline">USD {formatNum(fx.rates.USD, 2)} · EUR {formatNum(fx.rates.EUR, 2)}</span>
            </span>
            <RefreshCw className="w-3 h-3 flex-shrink-0" />
          </button>
          <button
            onClick={() => setView({ name: 'settings' })}
            className="min-h-[40px] min-w-[40px] rounded-full bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 flex items-center justify-center transition-colors"
            title="Ayarlar"
            aria-label="Ayarlar"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
