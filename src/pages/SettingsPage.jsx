import { useState } from 'react';
import { Mail, LogOut, Globe, RefreshCw, Check } from 'lucide-react';
import { relativeTime } from '../lib/format.js';
import { inputClass } from '../components/InputField.jsx';

export default function SettingsPage({ fx, session, onRefresh, onManual, onLogout }) {
  const [usd, setUsd] = useState(fx.rates.USD?.toFixed(4) || '');
  const [eur, setEur] = useState(fx.rates.EUR?.toFixed(4) || '');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-stone-900">Ayarlar</h2>

      <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-stone-500" />
          <div className="font-medium text-stone-800">Hesap</div>
        </div>
        <div className="text-sm text-stone-700 truncate">{session?.user?.email}</div>
        <button
          onClick={onLogout}
          className="w-full mt-1 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-sm flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-4 h-4" /> Çıkış yap
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-stone-500" />
          <div className="font-medium text-stone-800">Döviz Kurları</div>
        </div>
        <div className="text-xs text-stone-500">
          Kaynak: {fx.source} · Güncelleme: {relativeTime(fx.fetchedAt)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-stone-500">USD → TRY</label>
            <input className={`mt-1 ${inputClass}`} value={usd} onChange={e => setUsd(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-stone-500">EUR → TRY</label>
            <input className={`mt-1 ${inputClass}`} value={eur} onChange={e => setEur(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="flex-1 px-3 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-sm flex items-center justify-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Otomatik güncelle
          </button>
          <button
            onClick={() => onManual({ USD: parseFloat(usd) || 0, EUR: parseFloat(eur) || 0 })}
            className="flex-1 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Manuel kaydet
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-stone-100 p-4 text-xs text-stone-600 space-y-2">
        <div className="font-medium text-stone-800 text-sm">Veri</div>
        <p>Veriler Supabase bulutunda tutulur, RLS ile sadece sen erişebilirsin. Aynı hesapla farklı cihazlardan giriş yaparak senkron tutabilirsin.</p>
      </div>
    </div>
  );
}
