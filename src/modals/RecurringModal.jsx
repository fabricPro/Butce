import { useState } from 'react';
import {
  CATS, CURRENCY_LIST, FREQUENCIES, WEEKDAYS, AYLAR, uid,
} from '../constants.js';
import { todayStr } from '../lib/date.js';
import ModalShell from '../components/ModalShell.jsx';
import ModalFooter from '../components/ModalFooter.jsx';
import Field from '../components/Field.jsx';
import InputField, { SelectField } from '../components/InputField.jsx';

export default function RecurringModal({ rule, accounts, onClose, onSave }) {
  const editing = !!rule;
  const [name, setName] = useState(rule?.name || '');
  const [type, setType] = useState(rule?.type || 'gider');
  const [accountId, setAccountId] = useState(rule?.accountId || accounts[0]?.id || '');
  const [category, setCategory] = useState(rule?.category || (type === 'gelir' ? 'maas' : 'fatura'));
  const [amount, setAmount] = useState(rule?.amount?.toString() || '');
  const [currency, setCurrency] = useState(rule?.currency || 'TRY');
  const [frequency, setFrequency] = useState(rule?.frequency || 'aylik');
  const [dayOfMonth, setDayOfMonth] = useState(rule?.dayOfMonth?.toString() || '1');
  const [dayOfWeek, setDayOfWeek] = useState(rule?.dayOfWeek ?? 1);
  const [monthOfYear, setMonthOfYear] = useState(rule?.monthOfYear?.toString() || '1');
  const [startDate, setStartDate] = useState(rule?.startDate || todayStr());
  const [endDate, setEndDate] = useState(rule?.endDate || '');
  const [active, setActive] = useState(rule?.active ?? true);
  const [error, setError] = useState('');

  const save = () => {
    setError('');
    if (!name.trim()) { setError('Ad gerekli'); return; }
    if (!accountId) { setError('Hesap seç'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Tutar 0\'dan büyük olmalı'); return; }
    const next = {
      id: rule?.id || uid('rec'),
      name: name.trim(),
      type, accountId, category,
      amount: amt,
      currency, frequency,
      startDate,
      endDate: endDate || null,
      active,
      exceptions: rule?.exceptions || [],
      lastGeneratedDate: rule?.lastGeneratedDate || null,
      createdAt: rule?.createdAt || Date.now(),
    };
    if (frequency === 'aylik') next.dayOfMonth = Math.max(1, Math.min(31, parseInt(dayOfMonth, 10) || 1));
    if (frequency === 'haftalik') next.dayOfWeek = parseInt(dayOfWeek, 10);
    if (frequency === 'yillik') {
      next.dayOfMonth = Math.max(1, Math.min(31, parseInt(dayOfMonth, 10) || 1));
      next.monthOfYear = Math.max(1, Math.min(12, parseInt(monthOfYear, 10) || 1));
    }
    onSave(next);
  };

  const cats = CATS[type];

  return (
    <ModalShell
      title={editing ? 'Tekrarı düzenle' : 'Yeni tekrar'}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} onSave={save} />}
    >
      <Field label="Ad">
        <InputField value={name} onChange={e => setName(e.target.value)} placeholder="Örn. Kira, Spotify, Maaş" />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setType('gider')} className={`py-2 rounded-lg text-sm font-medium ${type === 'gider' ? 'bg-rose-100 text-rose-700' : 'bg-stone-100 text-stone-600'}`}>Gider</button>
        <button onClick={() => setType('gelir')} className={`py-2 rounded-lg text-sm font-medium ${type === 'gelir' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-stone-600'}`}>Gelir</button>
      </div>

      <Field label="Hesap">
        <SelectField value={accountId} onChange={e => setAccountId(e.target.value)}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </SelectField>
      </Field>

      <Field label="Kategori">
        <SelectField value={category} onChange={e => setCategory(e.target.value)}>
          {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </SelectField>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Tutar">
          <InputField type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <Field label="Para birimi">
          <SelectField value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectField>
        </Field>
      </div>

      <Field label="Sıklık">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(FREQUENCIES).map(([id, info]) => (
            <button key={id} onClick={() => setFrequency(id)} className={`py-2 rounded-lg text-sm ${frequency === id ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>
              {info.label}
            </button>
          ))}
        </div>
      </Field>

      {frequency === 'aylik' && (
        <Field label="Ayın günü" hint="1–31 (kısa aylar son güne kırpılır)">
          <InputField type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
        </Field>
      )}
      {frequency === 'haftalik' && (
        <Field label="Haftanın günü">
          <SelectField value={dayOfWeek} onChange={e => setDayOfWeek(parseInt(e.target.value, 10))}>
            {WEEKDAYS.map(w => <option key={w.id} value={w.id}>{w.full}</option>)}
          </SelectField>
        </Field>
      )}
      {frequency === 'yillik' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Gün">
            <InputField type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
          </Field>
          <Field label="Ay">
            <SelectField value={monthOfYear} onChange={e => setMonthOfYear(e.target.value)}>
              {AYLAR.map((a, i) => <option key={i} value={i + 1}>{a}</option>)}
            </SelectField>
          </Field>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Başlangıç">
          <InputField type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </Field>
        <Field label="Bitiş (opsiyonel)">
          <InputField type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
        Aktif
      </label>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</div>
      )}
    </ModalShell>
  );
}
