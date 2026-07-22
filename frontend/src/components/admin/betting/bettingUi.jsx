import { formatDisplayLabel } from '../../../lib';
import { formatVndCurrency } from '../../../lib/eventFormatters';

export const eventStatuses = ['ALL', 'DRAFT', 'OPEN', 'CLOSED', 'SETTLED', 'CANCELLED'];

const statusStyles = {
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  OPEN: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  CLOSED: 'border-amber-200 bg-amber-50 text-amber-700',
  SETTLED: 'border-sky-200 bg-sky-50 text-sky-700',
  CANCELLED: 'border-red-200 bg-red-50 text-red-700',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  INACTIVE: 'border-slate-200 bg-slate-50 text-slate-600',
  WON: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  LOST: 'border-red-200 bg-red-50 text-red-700',
  PLACED: 'border-amber-200 bg-amber-50 text-amber-700'
};

export const inputClass = 'min-h-11 rounded-xl border border-brown-200 bg-white px-3.5 py-2.5 text-sm font-bold text-brown-950 outline-none transition placeholder:text-slate-400 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20';

export function money(value) {
  return formatVndCurrency(value);
}

export function dateTime(value) {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function fromDateTimeLocal(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

export function StatusBadge({ status }) {
  const key = String(status || 'UNKNOWN').toUpperCase();
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 text-xs font-black uppercase ${statusStyles[key] || 'border-brown-200 bg-cream-100 text-brown-700'}`}>
      {formatDisplayLabel(status)}
    </span>
  );
}

export function ProductBadge({ code }) {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full border border-brown-200 bg-cream-100 px-3 py-1 text-xs font-black uppercase text-brown-800">
      {String(code || 'PRODUCT').toUpperCase()}
    </span>
  );
}

export function IconButton({ label, icon: Icon, onClick, disabled, tone = 'default' }) {
  const toneClass = tone === 'primary'
    ? 'border-brown-700 bg-brown-700 text-white hover:bg-brown-800'
    : tone === 'danger'
      ? 'border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100'
      : 'border-brown-200 bg-white text-brown-700 hover:border-brown-300 hover:bg-cream-100';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`inline-grid size-10 place-items-center rounded-lg border shadow-sm transition focus:outline-none focus:ring-4 focus:ring-gold-400/25 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <Icon size={17} />
    </button>
  );
}

export function SectionShell({ eyebrow, title, description, action, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-brown-200/70 bg-white shadow-[0_18px_50px_rgba(76,45,25,0.08)]">
      <div className="flex flex-col gap-4 border-b border-brown-100 bg-[linear-gradient(180deg,#fffaf2_0%,#ffffff_100%)] px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brown-500">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black text-brown-950">{title}</h2>
          {description && <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatCard({ label, value, description, icon: Icon, tone = 'text-brown-700' }) {
  return (
    <article className="rounded-2xl border border-brown-200/70 bg-white p-5 shadow-[0_14px_35px_rgba(76,45,25,0.07)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
          <strong className="mt-2 block truncate text-2xl font-black text-brown-950 lg:text-3xl">{value}</strong>
          {description && <span className="mt-1 block text-sm font-semibold text-slate-500">{description}</span>}
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-cream-100 ${tone}`}>
          <Icon size={21} />
        </span>
      </div>
    </article>
  );
}

export function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}
