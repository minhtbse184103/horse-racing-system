import { cn } from '../../lib/classNames.js';

const statusClasses = {
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  PENDING: 'bg-orange-50 text-orange-700 ring-orange-200',
  Pending: 'bg-orange-50 text-orange-700 ring-orange-200',
  'Pending Approval': 'bg-orange-50 text-orange-700 ring-orange-200',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  Owner: 'bg-[#1B5E20]/10 text-[#1B5E20] ring-[#1B5E20]/20',
  Admin: 'bg-slate-950 text-white ring-slate-900',
  Spectator: 'bg-slate-100 text-slate-700 ring-slate-200',
  'Not Registered': 'bg-slate-100 text-slate-700 ring-slate-200',
  Open: 'bg-[#D4AF37]/15 text-[#80630d] ring-[#D4AF37]/30',
  Upcoming: 'bg-blue-50 text-blue-700 ring-blue-200',
  Featured: 'bg-purple-50 text-purple-700 ring-purple-200'
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1',
        statusClasses[status] || 'bg-slate-100 text-slate-700 ring-slate-200',
        className
      )}
    >
      {status}
    </span>
  );
}
