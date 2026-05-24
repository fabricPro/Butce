import { RefreshCw } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin" /> Yükleniyor…
      </div>
    </div>
  );
}
