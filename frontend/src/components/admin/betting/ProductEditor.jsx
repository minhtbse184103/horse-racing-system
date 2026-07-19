import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Field, inputClass, ProductBadge, StatusBadge } from './bettingUi';

export default function ProductEditor({ product, onSave }) {
  const [form, setForm] = useState(() => ({
    name: product.name || '',
    description: product.description || '',
    minStake: product.minStake || 10000,
    maxDailyStake: product.maxDailyStake || 1000000,
    operatorFeeRate: Number(product.operatorFeeRate || 0) * 100,
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
    if (!form.name.trim()) return 'Tên sản phẩm là bắt buộc.';
    if (!Number.isFinite(minStake) || minStake < 10000) return 'Min stake phải từ 10.000 VND.';
    if (!Number.isFinite(maxDailyStake) || maxDailyStake < minStake) return 'Max daily stake không được nhỏ hơn min stake.';
    if (!Number.isFinite(operatorFeeRate) || operatorFeeRate < 0 || operatorFeeRate > 50) return 'Phí tổ chức phải từ 0% đến 50%.';
    return '';
  }

  async function save() {
    const validation = validate();
    setError(validation);
    if (validation) return;
    setIsSaving(true);
    try {
      await onSave(product.betProductId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        minStake: Number(form.minStake),
        maxDailyStake: Number(form.maxDailyStake),
        operatorFeeRate: Number(form.operatorFeeRate) / 100,
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
          <h3 className="mt-3 truncate text-lg font-black text-brown-950">{product.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
            {product.description || 'Chưa có mô tả sản phẩm cược.'}
          </p>
        </div>
        <StatusBadge status={form.active ? 'ACTIVE' : 'INACTIVE'} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <Field label="Tên sản phẩm">
          <input className={inputClass} value={form.name} onChange={(event) => update('name', event.target.value)} />
        </Field>
        <Field label="Trạng thái">
          <select className={inputClass} value={form.active ? 'true' : 'false'} onChange={(event) => update('active', event.target.value === 'true')}>
            <option value="true">ACTIVE</option>
            <option value="false">INACTIVE</option>
          </select>
        </Field>
        <Field label="Min stake">
          <input type="number" min="10000" step="10000" className={inputClass} value={form.minStake} onChange={(event) => update('minStake', event.target.value)} />
        </Field>
        <Field label="Max daily stake">
          <input type="number" min="10000" step="10000" className={inputClass} value={form.maxDailyStake} onChange={(event) => update('maxDailyStake', event.target.value)} />
        </Field>
        <Field label="Operator fee (%)">
          <input type="number" min="0" max="50" step="0.1" className={inputClass} value={form.operatorFeeRate} onChange={(event) => update('operatorFeeRate', event.target.value)} />
        </Field>
        <Field label="Mô tả">
          <input className={inputClass} value={form.description} onChange={(event) => update('description', event.target.value)} />
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
