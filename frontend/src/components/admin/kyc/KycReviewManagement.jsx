import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, RefreshCw, Search, ShieldCheck, XCircle } from 'lucide-react';
import KycReviewPanel, { getKycStatusLabel } from '../reviews/KycReviewPanel';
import { approveAdminKyc, getAdminKycRecords, rejectAdminKyc } from '../../../services/adminKycService';
import { formatDate } from '../../../lib';

const statusOptions = ['ALL', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'];

function StatusBadge({ status }) {
  return <span className={`status-badge ${String(status || '').toLowerCase()}`}>{String(status || 'NOT_SUBMITTED').replace(/_/g, ' ')}</span>;
}

function StatCard({ label, value, tone }) {
  return (
    <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4 shadow-sm">
      <span className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className={`mt-2 block text-3xl font-black ${tone}`}>{value}</strong>
    </div>
  );
}

function RejectModal({ reason, setReason, isLoading, error, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <h2 className="text-2xl font-black text-brown-900">Reject KYC</h2>
        <p className="mt-3 font-medium leading-7 text-slate-500">Enter the reason so the spectator can fix and resubmit KYC.</p>
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-extrabold text-brown-900">Reject reason *</span>
          <textarea
            className="min-h-32 w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Example: ID card image is blurry."
            disabled={isLoading}
          />
          {error && <span className="text-xs font-bold text-danger">{error}</span>}
        </label>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="outline-button" type="button" onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button className="outline-button danger-action" type="button" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function KycReviewManagement() {
  const [records, setRecords] = useState([]);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  async function loadRecords() {
    setIsLoading(true);
    setError('');
    try {
      setRecords(await getAdminKycRecords());
    } catch (err) {
      setError(err.message || 'Cannot load KYC records.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return records.filter((record) => {
      const status = String(record.status || '').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
      const haystack = [
        record.verificationId,
        record.userId,
        record.username,
        record.email,
        record.fullName,
        record.identityNumber,
        record.status
      ].join(' ').toLowerCase();
      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [records, search, statusFilter]);

  const stats = useMemo(() => ({
    pending: records.filter((record) => String(record.status).toUpperCase() === 'PENDING').length,
    verified: records.filter((record) => String(record.status).toUpperCase() === 'VERIFIED').length,
    rejected: records.filter((record) => String(record.status).toUpperCase() === 'REJECTED').length
  }), [records]);

  function updateRecord(updated) {
    setRecords((current) => current.map((item) => (item.verificationId === updated.verificationId ? updated : item)));
    setSelectedKyc(updated);
  }

  async function handleApprove(record = selectedKyc) {
    if (!record) return;
    setIsActionLoading(true);
    setError('');
    setMessage('');
    try {
      const updated = await approveAdminKyc(record.verificationId);
      updateRecord(updated);
      setMessage('KYC approved and wallet opened successfully.');
    } catch (err) {
      setError(err.message || 'Cannot approve KYC.');
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectError('Reject reason is required.');
      return;
    }

    setIsActionLoading(true);
    setError('');
    setMessage('');
    setRejectError('');
    try {
      const updated = await rejectAdminKyc(rejectTarget.verificationId, rejectReason.trim());
      updateRecord(updated);
      setRejectTarget(null);
      setRejectReason('');
      setMessage('KYC rejected successfully.');
    } catch (err) {
      setRejectError(err.message || 'Cannot reject KYC.');
    } finally {
      setIsActionLoading(false);
    }
  }

  if (selectedKyc) {
    const canReview = String(selectedKyc.status || '').toUpperCase() === 'PENDING';

    return (
      <section className="space-y-6 text-brown-900">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">KYC Review</p>
            <h1 className="mt-2 text-4xl font-black md:text-5xl">KYC #{selectedKyc.verificationId}</h1>
            <p className="mt-3 max-w-2xl font-medium text-slate-500">Review spectator identity documents and approve KYC to open the wallet.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:bg-cream-100" type="button" onClick={() => setSelectedKyc(null)}>
            <ArrowLeft size={17} />
            Back to list
          </button>
        </header>

        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {message && <div className="admin-alert success" role="status">{message}</div>}

        <section className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <div className="flex flex-col gap-3 border-b border-brown-700/10 pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">Spectator information</span>
              <h2 className="mt-1 text-2xl font-black">{selectedKyc.fullName || selectedKyc.username || selectedKyc.email}</h2>
              <p className="mt-2 font-medium text-slate-500">Submitted {formatDate(selectedKyc.submittedAt)}</p>
            </div>
            <StatusBadge status={selectedKyc.status} />
          </div>

          <KycReviewPanel kyc={selectedKyc} />

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-brown-700/10 pt-5 sm:flex-row sm:justify-end">
            <button className="outline-button" type="button" onClick={() => setSelectedKyc(null)} disabled={isActionLoading}>Back</button>
            <button className="outline-button danger-action" type="button" onClick={() => setRejectTarget(selectedKyc)} disabled={!canReview || isActionLoading}>
              <XCircle size={17} />
              Reject KYC
            </button>
            <button className="primary-button sm:w-auto" type="button" onClick={() => handleApprove(selectedKyc)} disabled={!canReview || isActionLoading}>
              <CheckCircle2 size={17} />
              {isActionLoading ? 'Processing...' : 'Approve & Open Wallet'}
            </button>
          </div>
        </section>

        {rejectTarget && (
          <RejectModal
            reason={rejectReason}
            setReason={(value) => {
              setRejectReason(value);
              setRejectError('');
            }}
            error={rejectError}
            isLoading={isActionLoading}
            onCancel={() => {
              setRejectTarget(null);
              setRejectReason('');
              setRejectError('');
            }}
            onConfirm={handleReject}
          />
        )}
      </section>
    );
  }

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">KYC Management</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">Spectator KYC review</h1>
          <p className="mt-3 max-w-2xl font-medium text-slate-500">Review identity submissions from spectators and open wallets after approval.</p>
        </div>
        <button className="outline-button compact-button" type="button" onClick={loadRecords} disabled={isLoading}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </header>

      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Pending KYC" value={stats.pending} tone="text-amber-700" />
        <StatCard label="Verified KYC" value={stats.verified} tone="text-green-700" />
        <StatCard label="Rejected KYC" value={stats.rejected} tone="text-danger" />
      </div>

      <section className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="flex min-h-12 items-center gap-3 rounded-lg border border-brown-700/10 bg-white px-4 lg:w-[24rem]">
            <Search size={17} className="text-slate-400" />
            <input
              className="h-full min-h-12 flex-1 bg-transparent text-sm font-bold text-brown-900 outline-none placeholder:text-slate-400"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, user ID, identity number"
            />
          </div>
          <select
            className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statusOptions.map((status) => (
              <option value={status} key={status}>{status === 'ALL' ? 'All statuses' : status}</option>
            ))}
          </select>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-brown-700/10 bg-white">
          {isLoading ? (
            <div className="p-8 text-center font-bold text-slate-500">Loading KYC records...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream-200 text-brown-700">
                <ShieldCheck size={22} />
              </div>
              <h3 className="mt-4 text-xl font-black text-brown-900">No KYC records found</h3>
              <p className="mx-auto mt-2 max-w-xl font-medium text-slate-500">Submitted spectator KYC records will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brown-700/10 text-left text-sm">
                <thead className="bg-cream-100 text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">KYC</th>
                    <th className="px-4 py-3">Spectator</th>
                    <th className="px-4 py-3">Identity</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brown-700/10">
                  {filteredRecords.map((record) => (
                    <tr className="align-top transition hover:bg-cream-100/55" key={record.verificationId}>
                      <td className="px-4 py-4 font-black text-brown-900">#{record.verificationId}</td>
                      <td className="px-4 py-4">
                        <strong className="block text-brown-900">{record.fullName || record.username || 'Not updated'}</strong>
                        <span className="mt-1 block text-xs font-bold text-slate-500">{record.email || `User #${record.userId}`}</span>
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-600">{record.identityNumber || 'Not updated'}</td>
                      <td className="px-4 py-4 font-bold text-slate-600">{formatDate(record.submittedAt)}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={record.status} />
                        <span className="mt-1 block text-xs font-bold text-slate-500">{getKycStatusLabel(record)}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="outline-button compact-button ml-auto" type="button" onClick={() => setSelectedKyc(record)}>
                          <Eye size={16} />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
