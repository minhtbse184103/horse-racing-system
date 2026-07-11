import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, Eye, RefreshCw, Search, XCircle } from 'lucide-react';
import UrlImagePreview from '../../common/UrlImagePreview';
import KycReviewPanel, { canApproveRoleWithKyc, getKycStatusLabel } from './KycReviewPanel';
import { getAdminKycByUserIds } from '../../../services/adminKycService';
import {
  approveJockeyProfile,
  getJockeyProfilesUnderReview,
  rejectJockeyProfile
} from '../../../services/adminProfileReviewService';

const PAGE_SIZE = 6;

const STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

const LICENCE_TYPE_LABELS = {
  TRAINEE: 'Tập sự',
  AMATEUR: 'Nghiệp dư',
  PROFESSIONAL: 'Chuyên nghiệp'
};

function isHttpUrl(value) {
  return /^https?:\/\/.+/i.test(String(value || '').trim());
}

function getValidImageUrls(profile) {
  return Array.isArray(profile?.imageUrls)
    ? profile.imageUrls.filter(isHttpUrl)
    : [];
}

function getVerificationLinks(profile) {
  return String(profile?.verificationLink || '')
    .split(/\r?\n/)
    .map((link) => link.trim())
    .filter(Boolean);
}

function displayValue(value) {
  return value === null || value === undefined || value === '' ? 'Not updated' : String(value);
}

function formatDate(value) {
  if (!value) return 'Not updated';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('vi-VN');
}

function getStatusLabel(status) {
  const normalized = String(status || '').toUpperCase();
  return STATUS_LABELS[normalized] || displayValue(status);
}

function getLicenceTypeLabel(value) {
  const normalized = String(value || '').toUpperCase();
  return LICENCE_TYPE_LABELS[normalized] || displayValue(value);
}

function StatusBadge({ status }) {
  return <span className={`status-badge ${String(status || '').toLowerCase()}`}>{getStatusLabel(status)}</span>;
}

function InfoCard({ label, value, children }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">
        {children || displayValue(value)}
      </strong>
    </div>
  );
}

function DocumentCard({ label, url }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      {url ? (
        <a className="outline-button compact-button mt-3 inline-flex max-w-full break-all" href={url} target="_blank" rel="noreferrer">
          View document
        </a>
      ) : (
        <strong className="mt-1 block text-brown-900">Not updated</strong>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-brown-700/20 bg-white/60 p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream-200 text-xl font-black text-brown-700">JR</div>
      <h3 className="mt-4 text-xl font-black text-brown-900">No jockey profiles</h3>
      <p className="mx-auto mt-2 max-w-xl font-medium text-slate-500">No jockey review records match the current search and status filter.</p>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel, confirmTone = 'primary', isLoading, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <h2 className="text-2xl font-black text-brown-900">{title}</h2>
        <p className="mt-3 font-medium leading-7 text-slate-500">{message}</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="outline-button" type="button" onClick={onCancel} disabled={isLoading}>Cancel</button>
          <button className={confirmTone === 'danger' ? 'outline-button danger-action' : 'primary-button sm:w-auto'} type="button" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function RejectModal({ profile, reason, setReason, isLoading, onCancel, onConfirm }) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 px-4 backdrop-blur-sm">
      <section className="w-full max-w-lg rounded-[28px] border border-brown-700/10 bg-cream-100 p-6 shadow-[0_28px_80px_rgba(43,23,16,0.3)]">
        <h2 className="text-2xl font-black text-brown-900">Reject jockey profile</h2>
        <p className="mt-3 font-medium leading-7 text-slate-500">
          Add feedback for {profile.fullName} so the jockey can update the profile and submit again.
        </p>
        <label className="mt-5 grid gap-2">
          <span className="text-sm font-extrabold text-brown-900">Rejection feedback</span>
          <textarea
            className="min-h-32 w-full rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none transition placeholder:text-slate-500/65 focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain what the jockey needs to correct..."
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

export default function JockeyReview() {
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  async function loadProfiles() {
    setIsLoading(true);
    setError('');

    try {
      const data = await getJockeyProfilesUnderReview();
      const list = Array.isArray(data) ? data : [];
      const kycByUserId = await getAdminKycByUserIds(list.map((profile) => profile.jockeyId));
      setProfiles(list.map((profile) => ({
        ...profile,
        kyc: kycByUserId.get(Number(profile.jockeyId)) || null
      })));
    } catch (err) {
      setError(err.message || 'Cannot load jockey review profiles.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  const filteredProfiles = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return profiles.filter((profile) => {
      const status = String(profile.status || '').toUpperCase();
      const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
      const haystack = [
        profile.jockeyId,
        profile.reviewId,
        profile.fullName,
        profile.email,
        profile.licenseNo,
        profile.licenceType,
        profile.status
      ]
        .filter((value) => value !== null && value !== undefined)
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [profiles, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleProfiles = filteredProfiles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pendingCount = profiles.filter((profile) => String(profile.status || '').toUpperCase() === 'PENDING').length;
  const approvedCount = profiles.filter((profile) => String(profile.status || '').toUpperCase() === 'APPROVED').length;
  const rejectedCount = profiles.filter((profile) => String(profile.status || '').toUpperCase() === 'REJECTED').length;

  function canReview(profile) {
    return String(profile?.status || '').toUpperCase() === 'PENDING';
  }

  function canApprove(profile) {
    return canReview(profile)
      && getValidImageUrls(profile).length > 0
      && canApproveRoleWithKyc(profile.kyc);
  }

  async function handleApprove() {
    if (!approveTarget) return;

    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      await approveJockeyProfile(approveTarget.reviewId);
      const kycByUserId = await getAdminKycByUserIds([approveTarget.jockeyId]);
      const approvedKyc = kycByUserId.get(Number(approveTarget.jockeyId)) || approveTarget.kyc || null;
      setApproveTarget(null);
      setSelectedProfile((current) => current ? { ...current, kyc: approvedKyc, status: 'APPROVED' } : null);
      setMessage(`${approveTarget.fullName} was approved.`);
      await loadProfiles();
    } catch (err) {
      setError(err.message || 'Cannot approve jockey profile.');
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
      await rejectJockeyProfile(rejectTarget.reviewId, rejectReason);
      setRejectTarget(null);
      setRejectReason('');
      setSelectedProfile(null);
      setMessage(`${rejectTarget.fullName} was rejected.`);
      await loadProfiles();
    } catch (err) {
      setError(err.message || 'Cannot reject jockey profile.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (selectedProfile) {
    const licenseUrls = getValidImageUrls(selectedProfile);
    const verificationLinks = getVerificationLinks(selectedProfile);
    const isPending = canReview(selectedProfile);

    return (
      <section className="space-y-6 text-brown-900">
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">Jockey profile detail</p>
            <h1 className="mt-2 text-4xl font-black md:text-5xl">Jockey #{displayValue(selectedProfile.jockeyId)}</h1>
            <p className="mt-3 max-w-2xl font-medium text-slate-500">Review license, contact information, and proof documents.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:bg-cream-100" type="button" onClick={() => setSelectedProfile(null)}>
            <ArrowLeft size={17} />
            Back to list
          </button>
        </header>

        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {message && <div className="admin-alert success" role="status">{message}</div>}

        <section className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <div className="flex flex-col gap-3 border-b border-brown-700/10 pb-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">Profile information</span>
              <h2 className="mt-1 text-2xl font-black">{displayValue(selectedProfile.fullName)}</h2>
              <p className="mt-2 font-medium text-slate-500">Submitted at {formatDate(selectedProfile.submittedAt)}</p>
            </div>
            <StatusBadge status={selectedProfile.status} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoCard label="Full name" value={selectedProfile.fullName} />
            <InfoCard label="Email" value={selectedProfile.email} />
            <InfoCard label="Jockey ID" value={selectedProfile.jockeyId} />
            <InfoCard label="Review ID" value={selectedProfile.reviewId} />
            <InfoCard label="License type" value={getLicenceTypeLabel(selectedProfile.licenceType || selectedProfile.licenseNo)} />
            <InfoCard label="Expiry date" value={formatDate(selectedProfile.expiryDate)} />
            <InfoCard label="Issuing authority" value={selectedProfile.issuingAuthority} />
            <InfoCard label="Weight" value={selectedProfile.weight ? `${selectedProfile.weight} kg` : ''} />
            <InfoCard label="Trainer name" value={selectedProfile.trainerName} />
            <InfoCard label="Trainer email" value={selectedProfile.trainerEmail} />
            <InfoCard label="Academy / stable address" value={selectedProfile.academyStableAddress} />
            <InfoCard label="Biography" value={selectedProfile.biography} />
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-black text-brown-900">Verification links</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {verificationLinks.length > 0 ? (
                verificationLinks.map((link, index) => <DocumentCard label={`Verification link ${index + 1}`} url={link} key={`${link}-${index}`} />)
              ) : (
                <InfoCard label="Verification links" value="" />
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-black text-brown-900">Jockey license images</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {licenseUrls.length > 0 ? (
                licenseUrls.map((url, index) => (
                  <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4" key={url}>
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">License image {index + 1}</span>
                    <UrlImagePreview
                      url={url}
                      alt={`${selectedProfile.fullName} license ${index + 1}`}
                      className="mt-3 max-h-[320px] w-full rounded-lg object-contain"
                    />
                    <a className="outline-button compact-button mt-3 inline-flex max-w-full break-all" href={url} target="_blank" rel="noreferrer">
                      Open image
                    </a>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger md:col-span-2">
                  No valid license image URL was submitted.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-black text-brown-900">Review information</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <InfoCard label="Status" value={getStatusLabel(selectedProfile.status)} />
              <InfoCard label="Submitted at" value={formatDate(selectedProfile.submittedAt)} />
              <InfoCard label="Reviewed at" value={formatDate(selectedProfile.reviewedAt)} />
              <InfoCard label="Reviewed by" value={selectedProfile.reviewedByName || selectedProfile.reviewedBy} />
            </div>
          </div>

          {selectedProfile.feedback && (
            <div className="mt-5 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
              Feedback: {selectedProfile.feedback}
            </div>
          )}

          <KycReviewPanel kyc={selectedProfile.kyc} />

          {isPending ? (
            <div className="mt-6 flex flex-wrap gap-3 border-t border-brown-700/10 pt-5">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-3 font-extrabold text-white shadow-sm transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={() => setApproveTarget(selectedProfile)}
                disabled={isProcessing || !canApprove(selectedProfile)}
                title={!canApprove(selectedProfile) ? 'A valid license image and pending/verified KYC are required before approval.' : 'Approve jockey, verify KYC, and open wallet'}
              >
                <BadgeCheck size={18} />
                Approve
              </button>
              <button className="outline-button danger-action inline-flex items-center gap-2" type="button" onClick={() => setRejectTarget(selectedProfile)} disabled={isProcessing}>
                <XCircle size={18} />
                Reject
              </button>
            </div>
          ) : (
            <div className="mt-6 border-t border-brown-700/10 pt-5">
              <StatusBadge status={selectedProfile.status} />
            </div>
          )}
        </section>

        {approveTarget && (
          <ConfirmModal
            title="Approve jockey profile"
            message={`Approve ${approveTarget.fullName}, verify KYC, open the wallet, and mark this jockey profile as verified?`}
            confirmLabel="Approve"
            isLoading={isProcessing}
            onCancel={() => setApproveTarget(null)}
            onConfirm={handleApprove}
          />
        )}

        <RejectModal
          profile={rejectTarget}
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

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">Manage jockeys</p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">Jockey Reviews</h1>
          <p className="mt-3 max-w-2xl font-medium text-slate-500">Review jockey license information, proof links, and submitted profile details.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:bg-cream-100 disabled:opacity-60" type="button" onClick={loadProfiles} disabled={isLoading}>
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {error && <div className="admin-alert error" role="alert">{error}</div>}
      {message && <div className="admin-alert success" role="status">{message}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]"><span className="text-sm font-extrabold uppercase text-slate-500">Pending</span><strong className="mt-2 block text-3xl font-black">{pendingCount}</strong></div>
        <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]"><span className="text-sm font-extrabold uppercase text-slate-500">Approved</span><strong className="mt-2 block text-3xl font-black">{approvedCount}</strong></div>
        <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]"><span className="text-sm font-extrabold uppercase text-slate-500">Rejected</span><strong className="mt-2 block text-3xl font-black">{rejectedCount}</strong></div>
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
              placeholder="Search by name, email, or license type"
            />
          </label>
          <select
            className="rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="mt-5 overflow-x-auto rounded-2xl border border-brown-700/10 bg-white/70">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-cream-200/70 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Jockey ID</th>
                <th className="px-4 py-3">Jockey</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3">KYC</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brown-700/10">
              {isLoading ? (
                <tr><td className="px-4 py-8 text-center font-bold text-slate-500" colSpan="7">Loading jockey profiles...</td></tr>
              ) : visibleProfiles.length === 0 ? (
                <tr><td className="px-4 py-8" colSpan="7"><EmptyState /></td></tr>
              ) : (
                visibleProfiles.map((profile) => (
                  <tr className="transition hover:bg-cream-200/35" key={profile.reviewId || profile.jockeyId}>
                    <td className="px-4 py-4 font-black text-brown-900">#{displayValue(profile.jockeyId)}</td>
                    <td className="px-4 py-4">
                      <strong className="block text-brown-900">{displayValue(profile.fullName)}</strong>
                      <small className="font-semibold text-slate-500">{displayValue(profile.email)}</small>
                    </td>
                    <td className="px-4 py-4">
                      <strong className="block text-brown-900">{getLicenceTypeLabel(profile.licenceType || profile.licenseNo)}</strong>
                      <small className="font-semibold text-slate-500">{getValidImageUrls(profile).length} image(s)</small>
                    </td>
                    <td className="px-4 py-4"><span className={`status-badge ${String(profile.kyc?.status || 'not_submitted').toLowerCase()}`}>{getKycStatusLabel(profile.kyc)}</span></td>
                    <td className="px-4 py-4 font-bold text-slate-500">{formatDate(profile.submittedAt)}</td>
                    <td className="px-4 py-4"><StatusBadge status={profile.status} /></td>
                    <td className="px-4 py-4 text-right">
                      <button className="inline-flex items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 py-2 font-extrabold text-brown-700 transition hover:bg-cream-200" type="button" onClick={() => setSelectedProfile(profile)}>
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
          <span className="text-sm font-bold text-slate-500">Page {currentPage} of {totalPages} - {filteredProfiles.length} record(s)</span>
          <div className="flex gap-2">
            <button className="outline-button" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1}>Previous</button>
            <button className="outline-button" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages}>Next</button>
          </div>
        </div>
      </section>
    </section>
  );
}
