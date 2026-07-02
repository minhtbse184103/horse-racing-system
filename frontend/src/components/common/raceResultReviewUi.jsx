import { formatDisplayLabel } from '../../lib';

export function formatReviewDateTime(value) {
  if (!value) return 'Chưa cập nhật';

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getReviewErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

export function ReviewStatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();
  const className = {
    SUBMITTED: 'border-amber-200 bg-amber-50 text-amber-800',
    REFEREE_CONFIRMED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    REFEREE_FLAGGED: 'border-rose-200 bg-rose-50 text-rose-800',
    ADMIN_APPROVED: 'border-blue-200 bg-blue-50 text-blue-800',
    ADMIN_REJECTED: 'border-slate-300 bg-slate-100 text-slate-700',
    APPROVE: 'border-blue-200 bg-blue-50 text-blue-800',
    REJECT: 'border-slate-300 bg-slate-100 text-slate-700',
    CONFIRM: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    FLAG: 'border-rose-200 bg-rose-50 text-rose-800'
  }[normalized] || 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase ${className}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {formatDisplayLabel(status)}
    </span>
  );
}
