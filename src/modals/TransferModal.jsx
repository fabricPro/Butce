import { useState } from 'react';
import { todayStr } from '../lib/date.js';
import ModalShell from '../components/ModalShell.jsx';
import ModalFooter from '../components/ModalFooter.jsx';
import Field from '../components/Field.jsx';
import InputField, { SelectField } from '../components/InputField.jsx';

export default function TransferModal({ accounts, initial, onClose, onSave }) {
  const defaultFrom = initial?.fromId
    || accounts.find(a => a.type !== 'kredi_karti' && a.id !== initial?.toId)?.id
    || accounts[0]?.id || '';
  const defaultTo = initial?.toId || accounts[1]?.id || accounts[0]?.id || '';
  const [fromId, setFromId] = useState(defaultFrom);
  const [toId, setToId] = useState(defaultTo);
  const [amount, setAmount] = useState(initial?.amount != null ? String(initial.amount) : '');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState(initial?.note || '');
  const [error, setError] = useState('');

  const save = () => {
    setError('');
    if (!fromId || !toId) { setError('İki hesap seç'); return; }
    if (fromId === toId) { setError('Aynı hesaba transfer olmaz'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError('Tutar 0\'dan büyük olmalı'); return; }
    onSave({ fromId, toId, amount: amt, date, note: note.trim() });
  };

  return (
    <ModalShell
      title={initial?.title || 'Hesaplar arası transfer'}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} onSave={save} saveLabel="Aktar" />}
    >
      <Field label="Kaynak hesap">
        <SelectField value={fromId} onChange={e => setFromId(e.target.value)}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </SelectField>
      </Field>
      <Field label="Hedef hesap">
        <SelectField value={toId} onChange={e => setToId(e.target.value)}>
          {accounts.filter(a => a.id !== fromId).map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </SelectField>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Tutar (kaynak para biriminde)">
          <InputField type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
        </Field>
        <Field label="Tarih">
          <InputField type="date" value={date} onChange={e => setDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Açıklama (opsiyonel)">
        <InputField value={note} onChange={e => setNote(e.target.value)} />
      </Field>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</div>
      )}
    </ModalShell>
  );
}
