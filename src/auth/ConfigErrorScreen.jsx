import { AlertTriangle } from 'lucide-react';

export default function ConfigErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="max-w-md text-center text-stone-700">
        <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        <h1 className="text-lg font-semibold mb-2">Supabase ayarlanmamış</h1>
        <p className="text-sm text-stone-500">
          <code>VITE_SUPABASE_URL</code> ve <code>VITE_SUPABASE_ANON_KEY</code> environment değişkenleri yok.
          GitHub repo Settings → Secrets and variables → Actions altında ekleyip yeniden deploy edin.
        </p>
      </div>
    </div>
  );
}
