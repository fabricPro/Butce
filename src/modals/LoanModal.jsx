import { useState, useEffect } from 'react';
import { CATS, uid } from '../constants.js';
import { todayStr } from '../lib/date.js';
import ModalShell from '../components/ModalShell.jsx';
import ModalFooter from '../components/ModalFooter.jsx';
import Field from '../components/Field.jsx';
import InputField, { SelectField } from '../components/InputField.jsx';

export default function LoanModal({ loan, accounts, onClose, onSave }) {
  const editing = !!loan;
  const [name, setName] = useState(loan?.name || '');
  const [lender, setLender] = useState(loan?.lender || '');
  const [accountId, setAccountId] = useState(loan?.accountId || accounts[0]?.id || '');
  const [totalAmount, setTotalAmount] = useState(loan?.totalAmount?.toString() || '');
  const [installmentCount, setInstallmentCount] = useState(loan?.installmentCount?.toString() || '12');
  const [monthlyPayment, setMonthlyPayment] = useState(loan?.monthlyPayment?.toString() || '');
  const [firstPaymentDate, setFirstPaymentDate] = useState(loan?.firstPaymentDate || todayStr());
  const [installmentsPaid, setInstallmentsPaid] = useState(loan?.installmentsPaid?.toString() || '0');
  const [category, setCategory] = useState(loan?.category || 'fatura');
  const [currency, setCurrency] = useState(
    loan?.currency
      || accounts.find(a => a.id === (loan?.accountId || accounts[0]?.id))?.currency
      || 'TRY',
  );
  const [notes, setNotes] = useState(loan?.notes || '');
  const [error, setError] = useState('');

  const suggestedMonthly = (() => {
    const t = parseFloat(totalAmount), c = parseInt(installmentCount, 10);
    if (t > 0 && c > 0) return (t / c).toFixed(2);
    return '';
  })();

  useEffect(() => {
    if (!editing) {
      const acc = accounts.find(a => a.id === accountId);
      if (acc) setCurrency(acc.currency);
    }
  }, [accountId, editing, accounts]);

  const save = () => {
    setError('');
    if (!name.trim()) { setError('Kredi adı gerekli'); return; }
    if (!accountId) { setError('Hesap seç'); return; }
    const total = parseFloat(totalAmount);
    const count = parseInt(installmentCount, 10);
    let monthly = parseFloat(monthlyPayment);
    if (!monthly && total > 0 && count > 0) monthly = total / count;
    if (!total || !count || !monthly) { setError('Tutar, taksit ve aylık alanlar gerekli'); return; }
    const paid = Math.max(0, Math.min(count, parseInt(installmentsPaid, 10) || 0));
    onSave({
      id: loan?.id || uid('loan'),
      name: name.trim(),
      lender: lender.trim() || null,
      accountId,
      totalAmount: total,
      installmentCount: count,
      monthlyPayment: monthly,
      firstPaymentDate,
      installmentsPaid: paid,
      category, currency,
      notes: notes.trim(),
      archived: loan?.archived || false,
      createdAt: loan?.createdAt || Date.now(),
    });
  };

  return (
    <ModalShell
      title={editing ? 'Krediyi düzenle' : 'Yeni kredi'}
      onClose={onClose}
      footer={<ModalFooter onClose={onClose} onSave={save} />}
    >
      <Field label="Kredi adı">
        <InputField value={name} onChange={e => setName(e.target.value)} placeholder="Örn. Konut Kredisi" />
      </Field>

      <Field label="Kredi veren (opsiyonel)">
        <InputField value={lender} onChange={e => setLender(e.target.value)} placeholder="Örn. Garanti BBVA" />
      </Field>

      <Field label="Taksit ödeme hesabı">
        <SelectField value={accountId} onChange={e => setAccountId(e.target.value)}>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>)}
        </SelectField>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Toplam tutar (faiz dahil)">
          <InputField type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
        </Field>
        <Field label="Taksit sayısı">
          <InputField type="number" min="1" max="360" value={installmentCount} onChange={e => setInstallmentCount(e.target.value)} />
        </Field>
      </div>

      <Field label="Aylık taksit" hint={suggestedMonthly && !monthlyPayment ? `Tahmini: ${suggestedMonthly}` : ''}>
        <InputField type="number" step="0.01" value={monthlyPayment} onChange={e => setMonthlyPayment(e.target.value)} placeholder={suggestedMonthly || '0,00'} />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="İlk taksit tarihi">
          <InputField type="date" value={firstPaymentDate} onChange={e => setFirstPaymentDate(e.target.value)} />
        </Field>
        <Field label="Ödenmiş taksit sayısı">
          <InputField type="number" min="0" max={installmentCount || 999} value={installmentsPaid} onChange={e => setInstallmentsPaid(e.target.value)} />
        </Field>
      </div>

      <Field label="Taksit kategorisi (işlem oluşurken)">
        <SelectField value={category} onChange={e => setCategory(e.target.value)}>
          {CATS.gider.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </SelectField>
      </Field>

      <Field label="Notlar (opsiyonel)">
        <InputField value={notes} onChange={e => setNotes(e.target.value)} />
      </Field>

      {error && (
        <div className="text-xs text-rose-700 bg-rose-50 rounded-lg p-2">{error}</div>
      )}
    </ModalShell>
  );
}
