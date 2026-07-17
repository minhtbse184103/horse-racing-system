import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ExternalLink, Eye, FileText, HeartPulse, RefreshCw, Search, ShieldCheck, X, XCircle } from 'lucide-react';
import { approveHorse, getHorses, rejectHorse } from '../../../services/adminHorseReviewService';
import { formatDate, getHorseId, getHorseName } from '../../../lib';

const PAGE_SIZE = 6;
const statusOptions = ['ALL', 'PENDING', 'ACTIVE', 'REJECTED'];

const STATUS_LABELS = {
  PENDING: 'Pending',
  ACTIVE: 'Approved',
  REJECTED: 'Rejected'
};

function displayValue(value) {
  return value === null || value === undefined || value === '' ? 'Not updated' : String(value);
}

function getStatusLabel(status) {
  const normalized = String(status || '').toUpperCase();
  return STATUS_LABELS[normalized] || displayValue(status);
}

function isPending(horse) {
  return String(horse?.status || '').toUpperCase() === 'PENDING';
}

function getDocuments(horse) {
  return Array.isArray(horse?.horseCertificateImages) ? horse.horseCertificateImages : [];
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${String(status || '').toLowerCase()}`}>{getStatusLabel(status)}</span>;
}

function StatCard({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
      <span className="text-sm font-extrabold uppercase text-slate-500">{label}</span>
      <strong className={`mt-2 block text-3xl font-black ${tone || 'text-brown-900'}`}>{value}</strong>
    </div>
  );
}

function InfoCard({ label, value, children }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-[0_8px_20px_rgba(78,44,25,0.05)]">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{children || displayValue(value)}</strong>
    </div>
  );
}

function DocumentCard({ label, document }) {
  const url = document?.dataUrl || document?.url || '';
  const isImage = String(document?.type || '').startsWith('image/') || /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url);

  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-[0_8px_20px_rgba(78,44,25,0.05)]">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      {url ? (
        isImage ? (
          <>
            <img className="mt-3 max-h-[280px] w-full rounded-lg object-contain" src={url} alt={label} />
            <a className="outline-button compact-button mt-3 inline-flex max-w-full break-all" href={url} target="_blank" rel="noreferrer">
              Open image
            </a>
          </>
        ) : (
          <a className="outline-button compact-button mt-3 inline-flex max-w-full break-all" href={url} target="_blank" rel="noreferrer">
            View document
          </a>
        )
      ) : (
        <strong className="mt-1 block text-brown-900">Not updated</strong>
      )}
    </div>
  );
}

function RejectModal({ horse, reason, setReason, isLoading, onCancel, onConfirm }) {
  if (!horse) return null;
  const horseName = getHorseName(horse) || `Horse ${getHorseId(horse)}`;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <h2 className="text-2xl font-black text-brown-900">Reject horse</h2>
        <p className="mt-3 font-medium leading-7 text-slate-500">Add feedback for {horseName} so the owner can correct the registration.</p>
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-extrabold text-brown-900">Rejection feedback *</span>
          <textarea
            className="min-h-32 w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain what does not match the official horse profile..."
            disabled={isLoading}
          />
          <span className="text-right text-xs font-bold text-slate-500">{reason.length}/500</span>
        </label>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="outline-button" type="button" onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button className="outline-button danger-action" type="button" onClick={onConfirm} disabled={isLoading || !reason.trim()}>
            {isLoading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-brown-700/20 bg-white/70 p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-lg bg-cream-200 text-brown-700">
        <ShieldCheck size={22} />
      </div>
      <h3 className="mt-4 text-xl font-black text-brown-900">No horse submissions</h3>
      <p className="mx-auto mt-2 max-w-xl font-medium text-slate-500">No horse records match the current search and status filter.</p>
    </div>
  );
}

export default function HorseReview() {
  const [horses, setHorses] = useState([]);
  const [selectedHorse, setSelectedHorse] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadHorses(nextStatus = statusFilter) {
    setIsLoading(true);
    setError('');

    try {
      setHorses(await getHorses(nextStatus === 'ALL' ? '' : nextStatus));
    } catch (err) {
      setError(err.message || 'Cannot load horse review records.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHorses('ALL');
  }, []);

  const filteredHorses = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return horses.filter((horse) => {
      const haystack = [
        getHorseId(horse),
        getHorseName(horse),
        horse.ownerId,
        horse.breeding,
        horse.colour,
        horse.sex,
        horse.trainer,
        horse.status
      ].filter((value) => value !== null && value !== undefined).join(' ').toLowerCase();

      return !keyword || haystack.includes(keyword);
    });
  }, [horses, search]);

  const stats = useMemo(() => ({
    pending: horses.filter((horse) => String(horse.status || '').toUpperCase() === 'PENDING').length,
    active: horses.filter((horse) => String(horse.status || '').toUpperCase() === 'ACTIVE').length,
    rejected: horses.filter((horse) => String(horse.status || '').toUpperCase() === 'REJECTED').length
  }), [horses]);

  const totalPages = Math.max(1, Math.ceil(filteredHorses.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleHorses = filteredHorses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function syncUpdatedHorse(updated, closeDetail = false) {
    setHorses((current) => current.map((horse) => (
      String(getHorseId(horse)) === String(getHorseId(updated))
        ? { ...horse, ...updated }
        : horse
    )));
    setSelectedHorse(closeDetail ? null : updated);
  }

  async function handleApprove(horse) {
    if (!horse || isProcessing) return;
    setIsProcessing(true);
    setError('');
    setMessage('');
    try {
      const updated = await approveHorse(getHorseId(horse));
      syncUpdatedHorse(updated, true);
      setMessage(`${getHorseName(updated) || 'Horse'} was approved.`);
      await loadHorses(statusFilter);
    } catch (err) {
      setError(err.message || 'Cannot approve horse.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setIsProcessing(true);
    setError('');
    setMessage('');
    try {
      const updated = await rejectHorse(getHorseId(rejectTarget), rejectReason);
      syncUpdatedHorse(updated, true);
      setRejectTarget(null);
      setRejectReason('');
      setMessage(`${getHorseName(updated) || 'Horse'} was rejected.`);
      await loadHorses(statusFilter);
    } catch (err) {
      setError(err.message || 'Cannot reject horse.');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleStatusChange(event) {
    const nextStatus = event.target.value;
    setStatusFilter(nextStatus);
    setPage(1);
    loadHorses(nextStatus);
  }

  const selectedDocuments = selectedHorse ? getDocuments(selectedHorse) : [];
  const selectedOfficialUrl = String(selectedHorse?.officialHorseProfileUrl || '').trim();
  const selectedPending = selectedHorse ? isPending(selectedHorse) : false;

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">Manage horses</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">Horse Reviews</h1>
          <p className="mt-3 max-w-2xl font-medium text-slate-500">Review submitted horse profiles, health certificates, and official profile links before approval.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:bg-cream-100 disabled:opacity-60" type="button" onClick={() => loadHorses(statusFilter)} disabled={isLoading}>
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={stats.pending} tone="text-amber-700" />
        <StatCard label="Approved" value={stats.active} tone="text-green-700" />
        <StatCard label="Rejected" value={stats.rejected} tone="text-danger" />
      </div>

      <section className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input
              className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by horse name, owner, breed, trainer..."
            />
          </label>
          <select
            className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            {statusOptions.map((status) => (
              <option value={status} key={status}>{status === 'ALL' ? 'All statuses' : getStatusLabel(status)}</option>
            ))}
          </select>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-brown-700/10 bg-white/70">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-cream-200/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Horse ID</th>
                <th className="px-4 py-3">Horse</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Health Expiry</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-700/10">
              {isLoading ? (
                <tr><td className="px-4 py-8 text-center font-bold text-slate-500" colSpan="8">Loading horse profiles...</td></tr>
              ) : visibleHorses.length === 0 ? (
                <tr><td className="px-4 py-8" colSpan="8"><EmptyState /></td></tr>
              ) : (
                visibleHorses.map((horse) => (
                  <tr className="transition hover:bg-cream-200/35" key={getHorseId(horse)}>
                    <td className="px-4 py-4 font-black text-brown-900">#{displayValue(getHorseId(horse))}</td>
                    <td className="px-4 py-4">
                      <strong className="block text-brown-900">{displayValue(getHorseName(horse))}</strong>
                      <small className="font-semibold text-slate-500">{displayValue(horse.breeding)} / {displayValue(horse.sex)}</small>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-500">#{displayValue(horse.ownerId)}</td>
                    <td className="px-4 py-4">
                      <strong className="block text-brown-900">{horse.weight ? `${horse.weight} kg` : 'Not updated'}</strong>
                      <small className="font-semibold text-slate-500">{displayValue(horse.colour)} / {displayValue(horse.trainer)}</small>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-500">{formatDate(horse.healthCertificateExpiryDate || horse.healthCertExpiry)}</td>
                    <td className="px-4 py-4 font-bold text-slate-500">{formatDate(horse.createdAt || horse.submittedAt)}</td>
                    <td className="px-4 py-4"><StatusBadge status={horse.status} /></td>
                    <td className="px-4 py-4 text-right">
                      <button className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 py-2 font-extrabold text-brown-700 transition hover:bg-cream-200" type="button" onClick={() => setSelectedHorse(horse)}>
                        <Eye size={16} />
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-bold text-slate-500">Page {currentPage} of {totalPages} - {filteredHorses.length} record(s)</span>
          <div className="flex gap-2">
            <button className="outline-button" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1}>Previous</button>
            <button className="outline-button" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages}>Next</button>
          </div>
        </div>
      </section>

      {selectedHorse && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={() => setSelectedHorse(null)}>
          <section
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-white/70 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="horse-review-detail-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="flex shrink-0 flex-col gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.82))] px-5 py-5 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">Horse review detail</p>
                <h1 id="horse-review-detail-title" className="mt-2 truncate text-3xl font-black md:text-4xl">Horse #{displayValue(getHorseId(selectedHorse))}</h1>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">Compare submitted horse details with official profile and health certificate documents.</p>
              </div>
              <button className="grid size-10 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 shadow-sm transition hover:bg-cream-200" type="button" onClick={() => setSelectedHorse(null)} aria-label="Close">
                <X size={18} />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {error && <div className="admin-alert error" role="alert">{error}</div>}
              {message && <div className="admin-alert success" role="status">{message}</div>}

              <section className="overflow-hidden rounded-lg border border-white/80 bg-white/70 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
                <div className="flex flex-col gap-3 border-b border-brown-700/10 md:flex-row md:items-start md:justify-between">
                  <div className="px-5 py-5">
                    <span className="text-xs font-extrabold uppercase text-brown-500">Horse information</span>
                    <h2 className="mt-1 text-2xl font-black">{displayValue(getHorseName(selectedHorse))}</h2>
                    <p className="mt-2 font-medium text-slate-500">Submitted at {formatDate(selectedHorse.createdAt || selectedHorse.submittedAt)}</p>
                  </div>
                  <div className="px-5 py-5"><StatusBadge status={selectedHorse.status} /></div>
                </div>

                <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                  <InfoCard label="Horse name" value={getHorseName(selectedHorse)} />
                  <InfoCard label="Owner ID" value={selectedHorse.ownerId} />
                  <InfoCard label="Age" value={selectedHorse.age} />
                  <InfoCard label="Date of birth" value={formatDate(selectedHorse.dayOfBirth)} />
                  <InfoCard label="Weight" value={selectedHorse.weight ? `${selectedHorse.weight} kg` : ''} />
                  <InfoCard label="Colour" value={selectedHorse.colour} />
                  <InfoCard label="Sex" value={selectedHorse.sex} />
                  <InfoCard label="Breeding" value={selectedHorse.breeding} />
                  <InfoCard label="Trainer" value={selectedHorse.trainer} />
                  <InfoCard label="Health certificate expiry" value={formatDate(selectedHorse.healthCertificateExpiryDate || selectedHorse.healthCertExpiry)} />
                  <InfoCard label="Registration count" value={selectedHorse.registrationCount} />
                  <InfoCard label="Participated" value={selectedHorse.participated ? 'Yes' : 'No'} />
                </div>

                <div className="border-t border-brown-700/10 px-5 py-5">
                  <h3 className="flex items-center gap-2 text-xl font-black text-brown-900"><FileText size={19} /> Official profile</h3>
                  <div className="mt-3 rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-[0_8px_20px_rgba(78,44,25,0.05)]">
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">Official Horse Profile URL</span>
                    <strong className="mt-1 block break-words text-brown-900">{selectedOfficialUrl || 'Not updated'}</strong>
                    {selectedOfficialUrl && (
                      <a className="outline-button compact-button mt-3 inline-flex max-w-full break-all" href={selectedOfficialUrl} target="_blank" rel="noreferrer">
                        <ExternalLink size={16} />
                        Open official website
                      </a>
                    )}
                  </div>
                </div>

                <div className="border-t border-brown-700/10 px-5 py-5">
                  <h3 className="flex items-center gap-2 text-xl font-black text-brown-900"><HeartPulse size={19} /> Health certificate</h3>
                  <div className="mt-3 grid gap-4 md:grid-cols-2">
                    {selectedDocuments.length > 0 ? (
                      selectedDocuments.map((document, index) => <DocumentCard document={document} label={`Health certificate ${index + 1}`} key={document.id || document.url || index} />)
                    ) : (
                      <InfoCard label="Health certificate" value="" />
                    )}
                  </div>
                </div>

                {selectedHorse.rejectionReason && (
                  <div className="mx-5 mb-5 rounded-lg border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
                    Rejection reason: {selectedHorse.rejectionReason}
                  </div>
                )}

                {selectedPending ? (
                  <div className="flex flex-wrap gap-3 border-t border-brown-700/10 bg-white/70 px-5 py-4">
                    <button className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 font-extrabold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => handleApprove(selectedHorse)} disabled={isProcessing}>
                      <BadgeCheck size={18} />
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </button>
                    <button className="outline-button danger-action inline-flex items-center gap-2" type="button" onClick={() => setRejectTarget(selectedHorse)} disabled={isProcessing}>
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-brown-700/10 bg-white/70 px-5 py-4">
                    <StatusBadge status={selectedHorse.status} />
                  </div>
                )}
              </section>
            </div>
          </section>
        </div>
      )}

      <RejectModal
        horse={rejectTarget}
        reason={rejectReason}
        setReason={setRejectReason}
        isLoading={isProcessing}
        onCancel={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        onConfirm={handleReject}
      />
    </section>
  );
}
