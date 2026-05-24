import { useState } from 'react';
import { ACCOUNT_TYPES, ACCOUNT_COLORS, CURRENCY_LIST, uid } from '../constants.js';
import ModalShell from '../components/ModalShell.jsx';
import ModalFooter from '../components/ModalFooter.jsx';
import Field from '../components/Field.jsx';
import InputField, { SelectField } from '../components/InputField.jsx';

export default function AccountModal({ account, onClose, onSave }) {
  const editing = !!account;
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState(account?.type || 'banka');
  const [currency, setCurrency] = useState(account?.currency || 'TRY');
  const [color, setColor] = useState(account?.color || ACCOUNT_COLORS[0]);
  const [initialBalance, setInitialBalance] = useState(account?.initialBalance?.toString() || '0');
  const [cutoffDay, setCutoffDay] = useState(account?.cutoffDay?.toString() || '1');
  const [paymentDueDay, setPaymentDueDay] = useState(account?.paymentDueDay?.toString() || '');
  const [creditLimit, setCreditLimit] = useState(account?.creditLimit?.toString() || '');
  const [error, setError] = useState('');

  const save = () => {
    setError('');
    if (!name.trim()) { setError('Ad gerekli'); return; }
    const next = {
      id: account?.id || uid('acc'),
      name: name.trim(),
      type, currency, color,
      initialBalance: parseFloat(initialBalance) || 0,
      archived: account?.archived || false,
      createdAt: account?.createdAt || Date.now(),
    };
    if (type === 'kredi_karti') {
      next.cutoffDay = Math.max(1, Math.min(28, parseInt(cutoffDay, 10) || 1));
      if (paymentDueDay) next.paymentDueDay = Math.max(1, Math.min(28, parseInt(paymentDueDay, 10) || 1));
      if (creditLimit) next.creditLimit = parseFloat(creditLimit) || 0;
    }
    onSave(next);
  };

  return (
    <ModalShell
      title={editing ? 'Hesabı düzenle' : 'Yeni hesap'}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} onSave={save} />}
    >
      <Field label="Ad">
        <InputField value={name} onChange={e => setName(e.target.value)} />
      </Field>

      <Field label="Tür">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ACCOUNT_TYPES).map(([id, info]) => (
            <button
              key={id}
              onClick={() => setType(id)}
              className={`p-2 rounded-lg flex flex-col items-center gap-1 text-xs ${type === id ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}
            >
              <info.Icon className="w-4 h-4" />
              <span>{info.label}</span>
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Para birimi">
          <SelectField value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCY_LIST.map(c => <option key={c} value={c}>{c}</option>)}
          </SelectField>
        </Field>
        <Field label="Başlangıç bakiyesi">
          <InputField type="number" step="0.01" value={initialBalance} onChange={e => setInitialBalance(e.target.value)} />
        </Field>
      </div>

      {type === 'kredi_karti' && (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Kesim günü" hint="1–28">
            <InputField type="number" min="1" max="28" value={cutoffDay} onChange={e => setCutoffDay(e.target.value)} />
          </Field>
          <Field label="Son ödeme günü">
            <InputField type="number" min="1" max="28" value={paymentDueDay} onChange={e => setPaymentDueDay(e.target.value)} />
          </Field>
          <Field label="Limit">
            <InputField type="number" step="100" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} />
          </Field>
        </div>
      )}

      <Field label="Renk">
        <div className="flex gap-2 flex-wrap">
          {ACCOUNT_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 ${color === c ? 'border-stone-800' : 'border-transparent'}`}
              style={{ background: c }}
              aria-label={`Renk ${c}`}
            />
          ))}
        </div>
      </Field>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</div>
      )}
    </ModalShell>
  );
}
