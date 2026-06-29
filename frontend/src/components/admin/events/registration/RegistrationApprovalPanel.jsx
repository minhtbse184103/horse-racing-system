import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronRight, ClipboardCheck, LoaderCircle, RefreshCw } from 'lucide-react';
import { REGISTRATION_FILTER_ALL } from '../operations/operationConstants';
import RegistrationFilters from './RegistrationFilters';
import RegistrationList from './RegistrationList';
import RegistrationReviewDialog from './RegistrationReviewDialog';
import { filterRegistrations, getRegistrationSummary, getTournamentRegistrations } from './registrationHelpers';

const DEFAULT_FILTERS = {
  search: '',
  paymentStatus: REGISTRATION_FILTER_ALL,
  approvalStatus: REGISTRATION_FILTER_ALL
};

export default function RegistrationApprovalPanel({
  tournament,
  registrations,
  isLoading,
  loadError,
  onRetry,
  onApprove,
  onReject
}) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const tournamentRegistrations = useMemo(
    () => getTournamentRegistrations(registrations, tournament.id),
    [registrations, tournament.id]
  );
  const filteredRegistrations = useMemo(
    () => filterRegistrations(tournamentRegistrations, filters),
    [filters, tournamentRegistrations]
  );
  const summary = useMemo(() => getRegistrationSummary(tournamentRegistrations), [tournamentRegistrations]);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function decideRegistration(registration, status, reason = null) {
    if (status === 'APPROVED') {
      await onApprove(registration.id);
    } else {
      await onReject(registration.id, reason);
    }
    setSelectedRegistration(null);
  }

  return (
    <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/75 shadow-[0_10px_30px_rgba(78,44,25,0.07)]">
      <header className="border-b border-brown-700/10">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full flex-col gap-3 px-4 py-3.5 text-left transition hover:bg-white/50 lg:flex-row lg:items-center lg:justify-between"
          aria-expanded={expanded}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${expanded ? 'bg-brown-700 text-white' : 'bg-cream-200 text-brown-700'}`}>
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-xs font-black uppercase text-brown-500"><ClipboardCheck size={15} /> Registration của Tournament</span>
              <span className="mt-1 block text-lg font-black text-brown-900">Duyệt Registration</span>
              <span className="mt-0.5 block text-xs font-semibold text-slate-500">{summary.approved} đã duyệt · {summary.pending} đang chờ · {summary.paid} đã thanh toán · {summary.total} tổng cộng</span>
            </span>
          </div>
          <span className="max-w-full truncate rounded-full bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700" title={tournament.name}>{expanded ? 'Ẩn danh sách Registration' : 'Mở danh sách Registration'} · {tournament.name}</span>
        </button>
      </header>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
            {isLoading ? (
              <div className="grid min-h-44 place-items-center p-6 text-center"><div><LoaderCircle className="mx-auto animate-spin text-brown-500" size={25} /><p className="mt-3 font-black text-brown-900">Đang tải Registration</p><p className="mt-1 text-xs font-semibold text-slate-500">Đang tải danh sách chờ duyệt và lịch sử hiện tại.</p></div></div>
            ) : loadError ? (
              <div className="grid min-h-44 place-items-center p-6 text-center"><div className="max-w-md"><AlertTriangle className="mx-auto text-danger" size={25} /><p className="mt-3 font-black text-brown-900">Không thể tải Registration</p><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{loadError}</p><button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-brown-700 px-4 text-xs font-extrabold text-white hover:bg-brown-900"><RefreshCw size={14} /> Thử lại</button></div></div>
            ) : (
              <>
                <RegistrationFilters filters={filters} resultCount={filteredRegistrations.length} onChange={updateFilter} onReset={() => setFilters(DEFAULT_FILTERS)} />
                <RegistrationList registrations={filteredRegistrations} onReview={setSelectedRegistration} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedRegistration && <RegistrationReviewDialog registration={selectedRegistration} onClose={() => setSelectedRegistration(null)} onDecision={decideRegistration} />}
      </AnimatePresence>
    </section>
  );
}
