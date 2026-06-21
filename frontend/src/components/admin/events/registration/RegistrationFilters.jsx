import { Search, SlidersHorizontal, X } from 'lucide-react';
import {
  APPROVAL_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  REGISTRATION_FILTER_ALL
} from '../operations/operationConstants';

const FILTER_CLASS = 'min-h-10 rounded-lg border border-brown-700/15 bg-white px-3 text-sm font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15';

export default function RegistrationFilters({ filters, resultCount, onChange, onReset }) {
  const hasFilters = filters.search
    || filters.paymentStatus !== REGISTRATION_FILTER_ALL
    || filters.approvalStatus !== REGISTRATION_FILTER_ALL;

  return (
    <div className="grid gap-2.5 border-b border-brown-700/10 bg-cream-200/30 p-3.5 lg:grid-cols-[minmax(15rem,1fr)_11rem_11rem_auto] lg:items-center">
      <label className="relative min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          className={`${FILTER_CLASS} w-full pl-9`}
          placeholder="Search registration, horse, owner"
        />
      </label>
      <select value={filters.paymentStatus} onChange={(event) => onChange('paymentStatus', event.target.value)} className={FILTER_CLASS} aria-label="Filter by payment status">
        <option value={REGISTRATION_FILTER_ALL}>All payments</option>
        {Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <select value={filters.approvalStatus} onChange={(event) => onChange('approvalStatus', event.target.value)} className={FILTER_CLASS} aria-label="Filter by approval status">
        <option value={REGISTRATION_FILTER_ALL}>All approvals</option>
        {Object.entries(APPROVAL_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-extrabold text-slate-500"><SlidersHorizontal size={14} />{resultCount} results</span>
        {hasFilters && (
          <button type="button" onClick={onReset} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-brown-700/15 bg-white px-3 text-xs font-extrabold text-brown-700 hover:bg-cream-200">
            <X size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
