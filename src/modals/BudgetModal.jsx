import { useState } from 'react';
import { CATS, uid } from '../constants.js';
import ModalShell from '../components/ModalShell.jsx';
import ModalFooter from '../components/ModalFooter.jsx';
import Field from '../components/Field.jsx';
import InputField, { SelectField } from '../components/InputField.jsx';

export default function BudgetModal({ goal, onClose, onSave }) {
  const editing = !!goal;
  const [category, setCategory] = useState(goal?.category || 'market');
  const [limit, setLimit] = useState(goal?.limit?.toString() || '');
  const [error, setError] = useState('');

  const save = () => {
    setError('');
    const amt = parseFloat(limit);
    if (!amt || amt <= 0) { setError('Limit 0\'dan büyük olmalı'); return; }
    onSave({
      id: goal?.id || uid('bud'),
      category,
      limit: amt,
      createdAt: goal?.createdAt || Date.now(),
    });
  };

  return (
    <ModalShell
      title={editing ? 'Hedefi düzenle' : 'Yeni bütçe hedefi'}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} onSave={save} />}
    >
      <Field label="Kategori">
        <SelectField value={category} onChange={e => setCategory(e.target.value)}>
          {CATS.gider.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </SelectField>
      </Field>
      <Field label="Aylık limit (TRY)">
        <InputField type="number" step="10" value={limit} onChange={e => setLimit(e.target.value)} placeholder="Örn. 4000" />
      </Field>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</div>
      )}
    </ModalShell>
  );
}
