import { useState } from 'react';
import { Mail, RefreshCw, Wallet } from 'lucide-react';
import { supabase } from '../supabase.js';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
  const [errMsg, setErrMsg] = useState('');

  const send = async (e) => {
    e?.preventDefault?.();
    if (!email || status === 'sending') return;
    setStatus('sending');
    setErrMsg('');
    const redirect = window.location.origin + import.meta.env.BASE_URL;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });
    if (error) { setStatus('error'); setErrMsg(error.message); return; }
    setStatus('sent');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white mx-auto mb-3 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-semibold text-stone-800">Bütçe</h1>
          <p className="text-xs text-stone-500 mt-1">E-posta adresinle giriş linkini al</p>
        </div>

        {status === 'sent' ? (
          <div className="text-center text-sm space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div className="text-stone-700">
              <span className="font-medium">{email}</span> adresine giriş linki gönderildi.
            </div>
            <div className="text-xs text-stone-500">Linke tıkladıktan sonra bu sayfaya geri yönlendirileceksin.</div>
            <button onClick={() => setStatus('idle')} className="text-xs text-amber-700 hover:underline">
              Farklı e-posta dene
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-3">
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adin@ornek.com"
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm"
            />
            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium flex items-center justify-center gap-2"
            >
              {status === 'sending' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {status === 'sending' ? 'Gönderiliyor…' : 'Giriş linki gönder'}
            </button>
            {status === 'error' && (
              <div className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{errMsg}</div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
