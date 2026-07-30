import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { betProductDescription, betProductName } from '../../../lib';
import { Field, inputClass, ProductBadge, StatusBadge } from './bettingUi';

const moneyInputFormatter = new Intl.NumberFormat('vi-VN', {
  maximumFractionDigits: 0
});

function formatMoneyInputValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? moneyInputFormatter.format(number) : '';
}

function parseMoneyInputValue(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits ? Number(digits) : '';
}

export default function ProductEditor({ product, onSave }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(() => ({
    minStake: product.minStake || 10000,
    maxDailyStake: product.maxDailyStake || 1000000,
    operatorFeeRate: Number(product.operatorFeeRate || 0) * 100,
    minimumOdds: Number(product.minimumOdds || 1.05),
    active: Boolean(product.active)
  }));
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  }

  function validate() {
    const minStake = Number(form.minStake);
    const maxDailyStake = Number(form.maxDailyStake);
    const operatorFeeRate = Number(form.operatorFeeRate);
    const minimumOdds = Number(form.minimumOdds);
    if (!Number.isFinite(minStake) || minStake < 10000) return 'Min stake phải từ 10.000 VND.';
    if (!Number.isFinite(maxDailyStake) || maxDailyStake < minStake) return 'Max daily stake không được nhỏ hơn min stake.';
    if (!Number.isFinite(operatorFeeRate) || operatorFeeRate < 0 || operatorFeeRate > 50) return 'Phí tổ chức phải từ 0% đến 50%.';
    if (!Number.isFinite(minimumOdds) || minimumOdds < 1.05) return 'Odds tối thiểu phải từ 1,05.';
    return '';
  }

  async function save() {
    const validation = validate();
    setError(validation);
    if (validation) return;
    setIsSaving(true);
    try {
      await onSave(product.betProductId, {
        name: product.name,
        description: product.description || null,
        minStake: Number(form.minStake),
        maxDailyStake: Number(form.maxDailyStake),
        operatorFeeRate: Number(form.operatorFeeRate) / 100,
        minimumOdds: Number(form.minimumOdds),
        active: Boolean(form.active)
      });
    } catch (err) {
      setError(err.message || 'Không thể lưu sản phẩm cược.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <article className="rounded-xl border border-brown-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <ProductBadge code={product.code} />
          <h3 className="mt-3 truncate text-lg font-black text-brown-950">{betProductName(product.code, t, product.name)}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
            {betProductDescription(product.code, t, product.description)}
          </p>
        </div>
        <StatusBadge status={form.active ? 'ACTIVE' : 'INACTIVE'} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <Field label="Trạng thái">
          <select className={inputClass} value={form.active ? 'true' : 'false'} onChange={(event) => update('active', event.target.value === 'true')}>
            <option value="true">ACTIVE</option>
            <option value="false">INACTIVE</option>
          </select>
        </Field>
        <Field label="Min stake">
          <span className="relative block">
            <input
              type="text"
              inputMode="numeric"
              className={`${inputClass} w-full pr-16`}
              value={formatMoneyInputValue(form.minStake)}
              onChange={(event) => update('minStake', parseMoneyInputValue(event.target.value))}
              aria-label="Min stake"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">VND</span>
          </span>
        </Field>
        <Field label="Max daily stake">
          <span className="relative block">
            <input
              type="text"
              inputMode="numeric"
              className={`${inputClass} w-full pr-16`}
              value={formatMoneyInputValue(form.maxDailyStake)}
              onChange={(event) => update('maxDailyStake', parseMoneyInputValue(event.target.value))}
              aria-label="Max daily stake"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">VND</span>
          </span>
        </Field>
        <Field label="Operator fee (%)">
          <input type="number" min="0" max="50" step="0.1" className={inputClass} value={form.operatorFeeRate} onChange={(event) => update('operatorFeeRate', event.target.value)} />
        </Field>
        <Field label="Minimum odds">
          <input type="number" min="1.05" step="0.01" className={inputClass} value={form.minimumOdds} onChange={(event) => update('minimumOdds', event.target.value)} />
        </Field>
      </div>

      {error && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}
      <div className="mt-4 flex justify-end">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brown-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-brown-800 focus:outline-none focus:ring-4 focus:ring-gold-400/25 disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={save}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {isSaving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </article>
  );
}
