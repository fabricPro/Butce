import { useEffect, useState } from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { CATS, CURRENCY_LIST, uid, getAccount } from '../constants.js';
import { todayStr } from '../lib/date.js';
import { formatMoney, formatNum } from '../lib/format.js';
import ModalShell from '../components/ModalShell.jsx';
import ModalFooter from '../components/ModalFooter.jsx';
import Field from '../components/Field.jsx';
import InputField, { SelectField } from '../components/InputField.jsx';

export default function TxModal({ tx, accounts, fx, onClose, onSave, onDelete }) {
  const editing = !!tx;
  const [type, setType] = useState(tx?.type || 'gider');
  const [accountId, setAccountId] = useState(tx?.accountId || accounts[0]?.id || '');
  const [category, setCategory] = useState(tx?.category || (type === 'gelir' ? 'maas' : 'market'));
  const [amount, setAmount] = useState(tx?.amount?.toString() || '');
  const [currency, setCurrency] = useState(tx?.currency || (accounts[0]?.currency || 'TRY'));
  const [date, setDate] = useState(tx?.date || todayStr());
  const [note, setNote] = useState(tx?.note || '');
  const [pending, setPending] = useState(tx?.status === 'pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!CATS[type].some(c => c.id === category)) {
      setCategory(type === 'gelir' ? 'maas' : 'market');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (!editing) {
      const acc = getAccount(accounts, accountId);
      if (acc) setCurrency(acc.currency);
    }
  }, [accountId, editing, accounts]);

  const save = () => {
    setError('');
    if (!accountId) { setError('Hesap seç'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Tutar 0\'dan büyük olmalı'); return; }
    const fxRate = currency === 'TRY' ? 1 : (fx.rates[currency] || 0);
    onSave({
      id: tx?.id || uid('tx'),
      type, accountId, category,
      amount: amt,
      currency,
      fxRate,
      amountTRY: amt * fxRate,
      date,
      note: note.trim(),
      source: tx?.source || 'manual',
      sourceId: tx?.sourceId,
      transferId: tx?.transferId,
      status: pending ? 'pending' : 'paid',
      installmentNo: tx?.installmentNo,
      createdAt: tx?.createdAt || Date.now(),
    });
  };

  const cats = CATS[type];

  return (
    <ModalShell
      title={editing ? 'İşlemi düzenle' : 'Yeni işlem'}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} onSave={save} onDelete={editing && onDelete ? onDelete : null} />}
    >
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setType('gider')} className={`py-2 rounded-lg text-sm font-medium ${type === 'gider' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'}`}>Gider</button>
        <button onClick={() => setType('gelir')} className={`py-2 rounded-lg text-sm font-medium ${type === 'gelir' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>Gelir</button>
      </div>

      <Field label="Hesap">
        <SelectField value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </SelectField>
      </Field>

      <Field label="Kategori">
        <div className="grid grid-cols-4 gap-2">
          {cats.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 text-[11px] ${category === c.id ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}
            >
              <c.Icon className="w-4 h-4" />
              <span className="truncate w-full text-center">{c.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <Field label="Tutar">
          <InputField type="number" inputMode="decimal" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
        </Field>
        <Field label="Para birimi">
          <SelectField value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectField>
        </Field>
        <Field label="Tarih">
          <InputField type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
      </div>

      <Field label="Açıklama (opsiyonel)">
        <InputField value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn. Migros alışveriş" />
      </Field>

      <button
        type="button"
        onClick={() => setPending(p => !p)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition ${pending ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'}`}
      >
        {pending ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        <span className="flex-1 text-left">
          {pending ? 'Bekleyen ödeme (bakiyeyi etkilemez)' : 'Ödendi (bakiyeye yansır)'}
        </span>
        <span className={`text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded ${pending ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-700'}`}>
          {pending ? 'bekliyor' : 'ödendi'}
        </span>
      </button>

      {currency !== 'TRY' && amount && (
        <div className="text-xs text-stone-500 bg-stone-50 rounded-lg p-2">
          ≈ {formatMoney((parseFloat(amount) || 0) * (fx.rates[currency] || 0), 'TRY')} (kur: {formatNum(fx.rates[currency] || 0, 4)})
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</div>
      )}
    </ModalShell>
  );
}
