import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileCheck2,
  History,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Trophy,
  X
} from 'lucide-react';
import {
  adaptRaceResultSubmissionDetail,
  adaptRaceResultSubmissionSummary
} from '../../../adapters/raceResultSubmissionAdapter';
import {
  approveRaceResultSubmission,
  getAdminRaceResultReviewQueue,
  getAdminRaceResultSubmissionDetail,
  rejectRaceResultSubmission
} from '../../../services/adminRaceResultReviewService';
import { formatDisplayLabel } from '../../../lib';

function formatDateTime(value) {
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

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();
  const className = normalized === 'REFEREE_CONFIRMED'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : normalized === 'REFEREE_FLAGGED'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : normalized === 'ADMIN_APPROVED'
        ? 'border-blue-200 bg-blue-50 text-blue-800'
        : normalized === 'ADMIN_REJECTED'
          ? 'border-slate-300 bg-slate-100 text-slate-700'
          : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase ${className}`}>
      <span className="size-1.5 rounded-full bg-current" />
      {formatDisplayLabel(status)}
    </span>
  );
}

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <article className="rounded-lg border border-brown-700/10 bg-white/80 p-4 shadow-[0_10px_28px_rgba(43,23,16,0.06)]">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-lg bg-cream-200 text-brown-700">
          <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
          <strong className="mt-1 block truncate text-2xl font-black text-brown-900">{value}</strong>
          {note && <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{note}</span>}
        </div>
      </div>
    </article>
  );
}

function EmptyState({ onRefresh }) {
  return (
    <section className="rounded-lg border border-dashed border-brown-700/20 bg-white/70 p-10 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-lg bg-cream-200 text-brown-700">
        <FileCheck2 size={26} />
      </div>
      <h3 className="mt-4 text-xl font-black text-brown-900">Không có kết quả đang chờ Admin review</h3>
      <p className="mx-auto mt-2 max-w-2xl font-semibold text-slate-500">
        Kết quả sẽ xuất hiện tại đây sau khi Referee confirm hoặc flag submission từ Unity.
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-black text-brown-700 shadow-sm hover:bg-cream-100"
      >
        <RefreshCw size={16} />
        Làm mới
      </button>
    </section>
  );
}

function AdminDecisionDialog({
  mode,
  submission,
  reason,
  onReasonChange,
  error,
  isSubmitting,
  onClose,
  onSubmit
}) {
  if (!mode || !submission) return null;

  const isReject = mode === 'reject';

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-xl rounded-lg bg-cream-100 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-brown-700/10 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">
              {isReject ? 'Reject Result' : 'Approve Result'}
            </p>
            <h2 className="mt-2 text-2xl font-black text-brown-900">{submission.raceName}</h2>
            <p className="mt-1 font-semibold text-slate-500">
              Submission #{submission.submissionId} · {submission.trackName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200"
            disabled={isSubmitting}
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-4 p-6">
          <div className={`rounded-lg border p-4 ${isReject ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <p className="text-sm font-bold">
              {isReject
                ? 'Từ chối kết quả này. Backend sẽ không tạo RaceResult chính thức và không tạo PrizeDistribution.'
                : 'Phê duyệt kết quả này. Backend sẽ tạo RaceResult chính thức, PrizeDistribution và chuyển Race sang COMPLETED.'}
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-brown-900">
              {isReject ? 'Lý do từ chối' : 'Ghi chú'}
              {isReject && <span className="text-rose-600"> *</span>}
            </span>
            <textarea
              className="min-h-32 rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-semibold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-brown-500/10"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={isReject ? 'Nhập lý do để Referee/Admin xử lý sau...' : 'Ghi chú tùy chọn cho lịch sử review...'}
              disabled={isSubmitting}
            />
          </label>

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-brown-700/10 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-black text-brown-700 hover:bg-cream-100"
            disabled={isSubmitting}
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-black text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${
              isReject ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isReject ? 'Reject Result' : 'Approve Result'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SubmissionDetail({ submission, isLoading, error, onBack, onRetry, onApprove, onReject }) {
  if (isLoading) {
    return (
      <section className="rounded-lg border border-brown-700/10 bg-white/80 p-10 text-center shadow-sm">
        <Loader2 className="mx-auto animate-spin text-brown-700" size={32} />
        <p className="mt-4 font-bold text-slate-500">Đang tải chi tiết submission...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-rose-200 bg-rose-50 p-6">
        <h3 className="text-lg font-black text-rose-800">Không thể tải chi tiết kết quả</h3>
        <p className="mt-2 font-semibold text-rose-700">{error}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-black text-white" type="button" onClick={onRetry}>
            Thử lại
          </button>
          <button className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700" type="button" onClick={onBack}>
            Quay lại review queue
          </button>
        </div>
      </section>
    );
  }

  if (!submission) return null;

  const latestRefereeAction = submission.reviewActions.find((action) => action.actorRole === 'REFEREE')
    || submission.reviewActions.find((action) => ['CONFIRM', 'FLAG'].includes(action.action));

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-brown-700/10 bg-white/85 shadow-[0_16px_44px_rgba(43,23,16,0.08)]">
        <header className="flex flex-col gap-4 border-b border-brown-700/10 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">Submission #{submission.submissionId}</p>
            <h2 className="mt-2 text-2xl font-black text-brown-900">{submission.raceName}</h2>
            <p className="mt-1 font-semibold text-slate-500">{submission.tournamentName} · {submission.trackName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="min-h-10 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-black text-brown-700 hover:bg-cream-100" type="button" onClick={onBack}>
              Quay lại
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 hover:bg-rose-100" type="button" onClick={onReject}>
              <ShieldAlert size={16} />
              Reject Result
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800" type="button" onClick={onApprove}>
              <CheckCircle2 size={16} />
              Approve Result
            </button>
          </div>
        </header>

        <div className="grid gap-4 p-5 lg:grid-cols-4">
          <div className="rounded-lg bg-cream-100 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Submission Status</span>
            <div className="mt-2"><StatusBadge status={submission.status} /></div>
          </div>
          <div className="rounded-lg bg-cream-100 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Race Date</span>
            <strong className="mt-2 block text-brown-900">{formatDateTime(submission.raceStartTime)}</strong>
          </div>
          <div className="rounded-lg bg-cream-100 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Submitted At</span>
            <strong className="mt-2 block text-brown-900">{formatDateTime(submission.submittedAt)}</strong>
          </div>
          <div className="rounded-lg bg-cream-100 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Horse Count</span>
            <strong className="mt-2 block text-brown-900">{submission.entries.length}</strong>
          </div>
        </div>

        <div className="border-t border-brown-700/10 p-5">
          <div className="rounded-lg border border-brown-700/10 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">Referee Decision</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={submission.status} />
              <span className="font-bold text-slate-500">
                {submission.refereeReviewedAt ? formatDateTime(submission.refereeReviewedAt) : latestRefereeAction ? formatDateTime(latestRefereeAction.createdAt) : 'Chưa có thời gian review'}
              </span>
            </div>
            <p className="mt-3 font-semibold text-slate-600">
              {submission.refereeComment || latestRefereeAction?.comment || 'Referee không để lại ghi chú.'}
            </p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/85 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-brown-700/10 bg-cream-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-brown-900">Entries table</h3>
            <p className="text-sm font-semibold text-slate-500">Kết quả provisional đã qua bước Referee review.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-brown-700">{submission.entries.length} horses</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[62rem] w-full text-left">
            <thead>
              <tr className="border-b border-brown-700/10 bg-white/70 text-xs font-black uppercase tracking-wide text-brown-700">
                <th className="px-5 py-3">Finish Position</th>
                <th className="px-5 py-3">Horse</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Jockey</th>
                <th className="px-5 py-3">Starting Stall</th>
                <th className="px-5 py-3">Finish Time</th>
                <th className="px-5 py-3">Points</th>
              </tr>
            </thead>
            <tbody>
              {submission.entries.map((entry) => (
                <tr className="border-b border-brown-700/10 last:border-b-0 hover:bg-cream-100/60" key={entry.id}>
                  <td className="px-5 py-4">
                    <span className="inline-grid size-10 place-items-center rounded-lg bg-cream-200 text-base font-black text-brown-700">#{entry.finishPosition}</span>
                  </td>
                  <td className="px-5 py-4">
                    <strong className="block text-brown-900">{entry.horseName}</strong>
                    <span className="text-xs font-bold text-slate-500">RaceEntry #{entry.raceEntryId || 'N/A'}</span>
                  </td>
                  <td className="px-5 py-4 font-bold text-brown-900">{entry.ownerName}</td>
                  <td className="px-5 py-4 font-bold text-brown-900">{entry.jockeyName}</td>
                  <td className="px-5 py-4 font-black text-brown-900">{entry.startingStall || 'N/A'}</td>
                  <td className="px-5 py-4 font-black text-brown-900">{entry.finishTime}</td>
                  <td className="px-5 py-4 font-black text-brown-900">{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-brown-700/10 bg-white/80 p-5">
        <div className="flex items-center gap-2">
          <History size={18} className="text-brown-500" />
          <h3 className="text-lg font-black text-brown-900">Review history</h3>
        </div>
        {submission.reviewActions.length === 0 ? (
          <p className="mt-4 rounded-lg bg-cream-100 p-4 font-semibold text-slate-500">Chưa có lịch sử review.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {submission.reviewActions.map((action) => (
              <article className="rounded-lg border border-brown-700/10 bg-cream-100 p-4" key={action.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={action.action} />
                  <strong className="text-brown-900">{action.actorRole || 'Reviewer'} #{action.actorUserId || 'N/A'}</strong>
                  <span className="text-sm font-semibold text-slate-500">{formatDateTime(action.createdAt)}</span>
                </div>
                {action.comment && <p className="mt-2 font-semibold text-slate-600">{action.comment}</p>}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default function AdminRaceResultReview() {
  const [submissions, setSubmissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [query, setQuery] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [listError, setListError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [toast, setToast] = useState('');
  const [dialogMode, setDialogMode] = useState(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionError, setDecisionError] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const flaggedCount = submissions.filter((submission) => submission.status === 'REFEREE_FLAGGED').length;
  const confirmedCount = submissions.filter((submission) => submission.status === 'REFEREE_CONFIRMED').length;

  const filteredSubmissions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return submissions;

    return submissions.filter((submission) => [
      submission.submissionId,
      submission.tournamentName,
      submission.raceName,
      submission.trackName,
      submission.status,
      submission.refereeComment
    ].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [query, submissions]);

  async function loadReviewQueue() {
    setIsLoadingList(true);
    setListError('');

    try {
      const data = await getAdminRaceResultReviewQueue();
      setSubmissions(Array.isArray(data) ? data.map(adaptRaceResultSubmissionSummary) : []);
    } catch (error) {
      setListError(getErrorText(error, 'Không thể tải review queue.'));
    } finally {
      setIsLoadingList(false);
    }
  }

  async function loadDetail(submissionId) {
    setSelectedId(submissionId);
    setDetail(null);
    setDetailError('');
    setToast('');
    setIsLoadingDetail(true);

    try {
      const data = await getAdminRaceResultSubmissionDetail(submissionId);
      setDetail(adaptRaceResultSubmissionDetail(data));
    } catch (error) {
      setDetailError(getErrorText(error, 'Không thể tải chi tiết submission.'));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadReviewQueue();
  }, []);

  function returnToQueue(message = '') {
    setSelectedId(null);
    setDetail(null);
    setDetailError('');
    setDialogMode(null);
    setDecisionReason('');
    setDecisionError('');
    if (message) setToast(message);
    loadReviewQueue();
  }

  function openDecisionDialog(mode) {
    setDialogMode(mode);
    setDecisionReason('');
    setDecisionError('');
  }

  function closeDecisionDialog() {
    if (isSubmittingDecision) return;
    setDialogMode(null);
    setDecisionReason('');
    setDecisionError('');
  }

  async function submitDecision() {
    if (!detail) return;

    const reason = decisionReason.trim();
    if (dialogMode === 'reject' && !reason) {
      setDecisionError('Vui lòng nhập lý do từ chối result.');
      return;
    }

    setIsSubmittingDecision(true);
    setDecisionError('');

    try {
      if (dialogMode === 'reject') {
        await rejectRaceResultSubmission(detail.submissionId, reason);
        returnToQueue('Result rejected.');
      } else {
        await approveRaceResultSubmission(detail.submissionId, reason);
        returnToQueue('Result approved.');
      }
    } catch (error) {
      setDecisionError(getErrorText(error, 'Không thể cập nhật quyết định Admin.'));
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  if (selectedId) {
    return (
      <>
        {toast && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{toast}</div>}
        <SubmissionDetail
          submission={detail}
          isLoading={isLoadingDetail}
          error={detailError}
          onBack={() => returnToQueue()}
          onRetry={() => loadDetail(selectedId)}
          onApprove={() => openDecisionDialog('approve')}
          onReject={() => openDecisionDialog('reject')}
        />
        <AdminDecisionDialog
          mode={dialogMode}
          submission={detail}
          reason={decisionReason}
          onReasonChange={setDecisionReason}
          error={decisionError}
          isSubmitting={isSubmittingDecision}
          onClose={closeDecisionDialog}
          onSubmit={submitDecision}
        />
      </>
    );
  }

  return (
    <section className="grid gap-5">
      {toast && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{toast}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Trophy} label="Review queue" value={submissions.length} note="Referee-reviewed submissions" />
        <MetricCard icon={CheckCircle2} label="Confirmed by Referee" value={confirmedCount} note="Ready for approval" />
        <MetricCard icon={AlertTriangle} label="Flagged by Referee" value={flaggedCount} note="Needs admin attention" />
      </section>

      <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/85 shadow-[0_16px_44px_rgba(43,23,16,0.08)]">
        <header className="flex flex-col gap-4 border-b border-brown-700/10 bg-cream-100/70 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">Admin Result Review</p>
            <h2 className="mt-1 text-2xl font-black text-brown-900">Review Queue</h2>
            <p className="mt-1 font-semibold text-slate-500">Phê duyệt hoặc từ chối kết quả đã qua bước Referee review.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="min-h-11 w-full rounded-lg border border-brown-700/15 bg-white pl-10 pr-4 text-sm font-bold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-brown-500/10 sm:w-72"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm Tournament, Race, track..."
              />
            </label>
            <button
              type="button"
              onClick={loadReviewQueue}
              disabled={isLoadingList}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-4 text-sm font-black text-white shadow-lg shadow-brown-900/10 hover:bg-brown-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingList ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Làm mới
            </button>
          </div>
        </header>

        {listError && (
          <div className="m-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {listError}
          </div>
        )}

        {isLoadingList ? (
          <div className="grid place-items-center p-12">
            <Loader2 className="animate-spin text-brown-700" size={32} />
            <p className="mt-4 font-bold text-slate-500">Đang tải review queue...</p>
          </div>
        ) : submissions.length === 0 && !listError ? (
          <div className="p-5">
            <EmptyState onRefresh={loadReviewQueue} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[72rem] w-full text-left">
              <thead>
                <tr className="border-b border-brown-700/10 text-xs font-black uppercase tracking-wide text-brown-700">
                  <th className="px-5 py-3">Submission ID</th>
                  <th className="px-5 py-3">Tournament</th>
                  <th className="px-5 py-3">Race</th>
                  <th className="px-5 py-3">Track</th>
                  <th className="px-5 py-3">Submitted At</th>
                  <th className="px-5 py-3">Referee Status</th>
                  <th className="px-5 py-3">Referee Comment</th>
                  <th className="px-5 py-3">Horse Count</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr className="border-b border-brown-700/10 last:border-b-0 hover:bg-cream-100/60" key={submission.submissionId}>
                    <td className="px-5 py-4 font-black text-brown-900">#{submission.submissionId}</td>
                    <td className="px-5 py-4">
                      <strong className="block text-brown-900">{submission.tournamentName}</strong>
                      <span className="text-xs font-bold text-slate-500">ID #{submission.tournamentId || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <strong className="block text-brown-900">{submission.raceName}</strong>
                      <span className="text-xs font-bold text-slate-500">Race #{submission.raceId || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-brown-900">{submission.trackName}</td>
                    <td className="px-5 py-4 font-bold text-brown-900">{formatDateTime(submission.submittedAt)}</td>
                    <td className="px-5 py-4"><StatusBadge status={submission.status} /></td>
                    <td className="max-w-[18rem] px-5 py-4">
                      <span className="line-clamp-2 text-sm font-semibold text-slate-600">
                        {submission.refereeComment || 'Mở chi tiết để xem review history.'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-black text-brown-900">{submission.horseCount}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => loadDetail(submission.submissionId)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-black text-brown-700 shadow-sm hover:bg-cream-100"
                      >
                        <Eye size={16} />
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSubmissions.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-bold text-slate-500">Không có submission phù hợp với từ khóa tìm kiếm.</p>
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
