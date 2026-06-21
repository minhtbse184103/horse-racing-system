import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, ClipboardCheck, LoaderCircle, RefreshCw } from 'lucide-react';
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
      <header className="flex flex-col gap-3 border-b border-brown-700/10 px-4 py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="flex items-center gap-2 text-xs font-black uppercase text-brown-500"><ClipboardCheck size={15} /> Registration của Tournament</p><h4 className="mt-1 text-lg font-black text-brown-900">Duyệt Registration</h4><p className="mt-0.5 text-xs font-semibold text-slate-500">{summary.approved} đã duyệt · {summary.pending} đang chờ · {summary.paid} đã thanh toán · {summary.total} tổng cộng</p></div>
        <span className="max-w-full truncate rounded-full bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700" title={tournament.name}>{tournament.name}</span>
      </header>
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
      <AnimatePresence>
        {selectedRegistration && <RegistrationReviewDialog registration={selectedRegistration} onClose={() => setSelectedRegistration(null)} onDecision={decideRegistration} />}
      </AnimatePresence>
    </section>
  );
}
