import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, RefreshCw, Search, XCircle } from 'lucide-react';
import { formatDate } from '../../../lib';
import { useLanguage } from '../../../context/LanguageContext';
import {
  approveOwnerApplication,
  getAllOwnerApplications,
  getOwnerApplicationById,
  rejectOwnerApplication
} from '../../../services/ownerApplicationService';

function StatusBadge({ status, t }) {
  return <span className={`status-badge ${String(status || '').toLowerCase()}`}>{t(`status_${String(status || '').toUpperCase()}`)}</span>;
}

function ConfirmModal({ title, message, confirmLabel, confirmTone = 'primary', isLoading, onCancel, onConfirm, t }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <h2 className="text-2xl font-black text-brown-900">{title}</h2>
        <p className="mt-3 font-medium leading-7 text-slate-500">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="outline-button" type="button" onClick={onCancel} disabled={isLoading}>{t('cancel')}</button>
          <button className={confirmTone === 'danger' ? 'outline-button danger-action' : 'primary-button sm:w-auto'} type="button" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('processing') : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function RejectModal({ reason, setReason, isLoading, onCancel, onConfirm, t }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <h2 className="text-2xl font-black text-brown-900">{t('rejectOwnerApplication')}</h2>
        <p className="mt-3 font-medium leading-7 text-slate-500">{t('rejectReasonRequired')}</p>
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-extrabold text-brown-900">{t('rejectReason')}</span>
          <textarea
            className="min-h-32 w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('rejectReasonPlaceholder')}
            disabled={isLoading}
          />
        </label>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="outline-button" type="button" onClick={onCancel} disabled={isLoading}>{t('cancel')}</button>
          <button className="outline-button danger-action" type="button" onClick={onConfirm} disabled={isLoading || !reason.trim()}>
            {isLoading ? t('processing') : t('confirmReject')}
          </button>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ t }) {
  return (
    <div className="rounded-[24px] border border-dashed border-brown-700/20 bg-white/60 p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream-200 text-2xl">📄</div>
      <h3 className="mt-4 text-xl font-black text-brown-900">{t('noOwnerApplications')}</h3>
      <p className="mx-auto mt-2 max-w-xl font-medium text-slate-500">{t('noOwnerApplicationsHint')}</p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || 'Not updated'}</strong>
    </div>
  );
}

function DocumentCard({ label, url }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      {url ? (
        <a className="outline-button compact-button mt-3 inline-flex" href={url} target="_blank" rel="noreferrer">
          View Document
        </a>
      ) : (
        <strong className="mt-1 block text-brown-900">Not updated</strong>
      )}
    </div>
  );
}

export default function OwnerApplicationManagement() {
  const { t } = useLanguage();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const pageSize = 6;

  async function loadApplications() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getAllOwnerApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || t('ownerApplicationsLoadError'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'ALL' || application.status === statusFilter;
      const haystack = [
        application.applicationID,
        application.fullName,
        application.applicantEmail,
        application.identityDocumentFileName,
        application.status
      ]
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [applications, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleApplications = filteredApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pendingCount = applications.filter((application) => application.status === 'PENDING').length;
  const approvedCount = applications.filter((application) => application.status === 'APPROVED').length;
  const rejectedCount = applications.filter((application) => application.status === 'REJECTED').length;

  async function handleViewDetails(applicationId) {
    setIsActionLoading(true);
    setError('');
    setMessage('');

    try {
      const detail = await getOwnerApplicationById(applicationId);
      setSelectedApplication(detail);
    } catch (err) {
      setError(err.message || t('ownerApplicationDetailLoadError'));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!approveTarget) return;

    setIsActionLoading(true);
    setError('');
    setMessage('');

    try {
      const updated = await approveOwnerApplication(approveTarget.applicationID);
      setApplications((current) => current.map((item) => (item.applicationID === updated.applicationID ? updated : item)));
      setSelectedApplication(updated);
      setApproveTarget(null);
      setMessage(t('ownerApplicationApproved'));
    } catch (err) {
      setError(err.message || t('ownerApplicationApproveError'));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;

    setIsActionLoading(true);
    setError('');
    setMessage('');

    try {
      const updated = await rejectOwnerApplication(rejectTarget.applicationID, rejectReason);
      setApplications((current) => current.map((item) => (item.applicationID === updated.applicationID ? updated : item)));
      setSelectedApplication(updated);
      setRejectTarget(null);
      setRejectReason('');
      setMessage(t('ownerApplicationRejected'));
    } catch (err) {
      setError(err.message || t('ownerApplicationRejectError'));
    } finally {
      setIsActionLoading(false);
    }
  }

  if (selectedApplication) {
    const canAct = selectedApplication.status === 'PENDING';

    return (
      <section className="space-y-6 text-brown-900">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">{t('ownerApplicationDetail')}</p>
            <h1 className="mt-2 text-4xl font-black md:text-5xl">{t('applicationNumber', { id: selectedApplication.applicationID })}</h1>
            <p className="mt-3 max-w-2xl font-medium text-slate-500">{t('reviewOwnerApplication')}</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:bg-cream-100" type="button" onClick={() => setSelectedApplication(null)}>
            <ArrowLeft size={17} />
            {t('backToList')}
          </button>
        </header>

        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {message && <div className="admin-alert success" role="status">{message}</div>}

        <section className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <div className="flex flex-col gap-3 border-b border-brown-700/10 pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">{t('personalInformation')}</span>
              <h2 className="mt-1 text-2xl font-black">{selectedApplication.fullName}</h2>
              <p className="mt-2 font-medium text-slate-500">{t('submittedDate', { date: formatDate(selectedApplication.submittedAt) })}</p>
            </div>
            <StatusBadge status={selectedApplication.status} t={t} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoCard label={t('fullName')} value={selectedApplication.fullName} />
            <InfoCard label={t('dateOfBirth')} value={formatDate(selectedApplication.dateOfBirth)} />
            <InfoCard label={t('gender')} value={selectedApplication.gender} />
            <InfoCard label={t('nationality')} value={selectedApplication.nationality} />
            <InfoCard label={t('address')} value={selectedApplication.address} />
            <InfoCard label={t('email')} value={selectedApplication.applicantEmail} />
            <InfoCard label={t('phone')} value={selectedApplication.applicantPhone} />
            <DocumentCard label="Identity Document" url={selectedApplication.identityDocumentUrl} />
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-black text-brown-900">Stable Information</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <InfoCard label="Stable Name" value={selectedApplication.stableName} />
              <InfoCard label="Stable Address" value={selectedApplication.stableAddress} />
              <DocumentCard label="Stable Certificate" url={selectedApplication.stableCertificateUrl} />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-black text-brown-900">Horse Ownership Proof</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <InfoCard label="Total Horses Owned" value={selectedApplication.totalHorsesOwned} />
              <DocumentCard label="Horse Ownership Proof" url={selectedApplication.horseOwnershipProofUrl} />
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-black text-brown-900">Application Information</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <InfoCard label="Status" value={selectedApplication.status} />
              <InfoCard label="Submitted At" value={formatDate(selectedApplication.submittedAt)} />
              <InfoCard label="Reviewed At" value={formatDate(selectedApplication.reviewedAt)} />
              <InfoCard label="Reviewed By" value={selectedApplication.reviewedBy} />
            </div>
          </div>

          {selectedApplication.rejectReason && (
            <div className="mt-5 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
              {t('rejectReason')}: {selectedApplication.rejectReason}
            </div>
          )}

          {canAct ? (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-brown-700/10 pt-5">
              <button className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 font-extrabold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => setApproveTarget(selectedApplication)} disabled={isActionLoading}>
                <CheckCircle2 size={18} />
                {t('approve')}
              </button>
              <button className="outline-button danger-action inline-flex items-center gap-2" type="button" onClick={() => setRejectTarget(selectedApplication)} disabled={isActionLoading}>
                <XCircle size={18} />
                {t('reject')}
              </button>
            </div>
          ) : (
            <div className="mt-6 border-t border-brown-700/10 pt-5">
              <StatusBadge status={selectedApplication.status} t={t} />
            </div>
          )}
        </section>

        {approveTarget && (
          <ConfirmModal
            title={t('approveOwnerApplication')}
            message={t('approveOwnerConfirm')}
            confirmLabel={t('approve')}
            isLoading={isActionLoading}
            onCancel={() => setApproveTarget(null)}
            onConfirm={handleApprove}
            t={t}
          />
        )}

        {rejectTarget && (
          <RejectModal
            reason={rejectReason}
            setReason={setRejectReason}
            isLoading={isActionLoading}
            onCancel={() => {
              setRejectTarget(null);
              setRejectReason('');
            }}
            onConfirm={handleReject}
            t={t}
          />
        )}
      </section>
    );
  }

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">{t('manageOwners')}</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">{t('ownerApplicationsTitle')}</h1>
          <p className="mt-3 max-w-2xl font-medium text-slate-500">{t('ownerApplicationsSubtitle')}</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:bg-cream-100 disabled:opacity-60" type="button" onClick={loadApplications} disabled={isLoading}>
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          {t('refresh')}
        </button>
      </header>

      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]"><span className="text-sm font-extrabold uppercase text-slate-500">{t('status_PENDING')}</span><strong className="mt-2 block text-3xl font-black">{pendingCount}</strong></div>
        <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]"><span className="text-sm font-extrabold uppercase text-slate-500">{t('status_APPROVED')}</span><strong className="mt-2 block text-3xl font-black">{approvedCount}</strong></div>
        <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]"><span className="text-sm font-extrabold uppercase text-slate-500">{t('status_REJECTED')}</span><strong className="mt-2 block text-3xl font-black">{rejectedCount}</strong></div>
      </div>

      <section className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} />
            <input className="w-full rounded-lg border border-brown-700/15 bg-white py-3 pl-10 pr-4 text-sm font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('searchOwnerApplications')} />
          </label>
          <select className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            <option value="ALL">{t('allStatuses')}</option>
            <option value="PENDING">{t('status_PENDING')}</option>
            <option value="APPROVED">{t('status_APPROVED')}</option>
            <option value="REJECTED">{t('status_REJECTED')}</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-brown-700/10 bg-white/70">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-cream-200/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('applicationId')}</th>
                <th className="px-4 py-3">{t('applicantName')}</th>
                <th className="px-4 py-3">{t('submissionDate')}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3 text-right">{t('action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-700/10">
              {isLoading ? (
                <tr><td className="px-4 py-8 text-center font-bold text-slate-500" colSpan="5">{t('loadingOwnerApplications')}</td></tr>
              ) : visibleApplications.length === 0 ? (
                <tr><td className="px-4 py-8" colSpan="5"><EmptyState t={t} /></td></tr>
              ) : (
                visibleApplications.map((application) => (
                  <tr className="transition hover:bg-cream-200/35" key={application.applicationID}>
                    <td className="px-4 py-4 font-black text-brown-900">#{application.applicationID}</td>
                    <td className="px-4 py-4"><strong className="block text-brown-900">{application.fullName}</strong><small className="font-semibold text-slate-500">{application.applicantEmail}</small></td>
                    <td className="px-4 py-4 font-bold text-slate-500">{formatDate(application.submittedAt)}</td>
                    <td className="px-4 py-4"><StatusBadge status={application.status} t={t} /></td>
                    <td className="px-4 py-4 text-right"><button className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 py-2 font-extrabold text-brown-700 transition hover:bg-cream-200" type="button" onClick={() => handleViewDetails(application.applicationID)}><Eye size={16} />{t('viewDetails')}</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-bold text-slate-500">{t('pageOf', { page: currentPage, total: totalPages, count: filteredApplications.length })}</span>
          <div className="flex gap-2">
            <button className="outline-button" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1}>{t('previous')}</button>
            <button className="outline-button" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages}>{t('next')}</button>
          </div>
        </div>
      </section>
    </section>
  );
}
