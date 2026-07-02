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
import {
  formatReviewDateTime,
  getReviewErrorText,
  ReviewStatusBadge
} from '../../common/raceResultReviewUi';

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <article className="rounded-lg border border-white/80 bg-cream-100/90 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
          <strong className="mt-2 block truncate text-3xl font-black text-brown-900">{value}</strong>
          {note && <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{note}</span>}
        </div>
        <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-cream-200 text-brown-700">
          <Icon size={18} strokeWidth={2.5} />
        </div>
      </div>
    </article>
  );
}

function EmptyState({ onRefresh }) {
  return (
    <section className="rounded-lg border border-dashed border-brown-700/20 bg-white/75 p-10 text-center shadow-[0_10px_30px_rgba(78,44,25,0.06)]">
      <div className="mx-auto grid size-14 place-items-center rounded-lg bg-cream-200 text-brown-700">
        <FileCheck2 size={26} />
      </div>
      <h3 className="mt-4 text-xl font-black text-brown-900">Không có kết quả chờ duyệt</h3>
      <p className="mx-auto mt-2 max-w-2xl font-semibold text-slate-500">
        Kết quả sẽ xuất hiện tại đây sau khi Referee xác nhận hoặc đánh dấu cần kiểm tra.
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-black text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)] transition hover:-translate-y-0.5 hover:bg-cream-100"
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
      <section className="w-full max-w-xl overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.88))] p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">
              {isReject ? 'Từ chối kết quả' : 'Phê duyệt kết quả'}
            </p>
            <h2 className="mt-2 text-2xl font-black text-brown-900">{submission.raceName}</h2>
            <p className="mt-1 font-semibold text-slate-500">
              Submission #{submission.submissionId} · {submission.trackName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)] hover:bg-cream-200"
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-4 p-6">
          <div className={`rounded-lg border p-4 shadow-[0_8px_22px_rgba(78,44,25,0.05)] ${isReject ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <p className="text-sm font-bold leading-6">
              {isReject
                ? 'Kết quả sẽ bị từ chối và Race sẽ quay lại trạng thái READY để chạy lại.'
                : 'Kết quả sẽ trở thành RaceResult chính thức, giải thưởng sẽ được ghi nhận và Race chuyển sang COMPLETED.'}
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-brown-900">
              {isReject ? 'Lý do từ chối' : 'Ghi chú'}
              {isReject && <span className="text-rose-600"> *</span>}
            </span>
            <textarea
              className="min-h-32 rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-semibold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-brown-500/10"
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={isReject ? 'Nhập lý do từ chối kết quả...' : 'Ghi chú tùy chọn cho lịch sử duyệt...'}
              disabled={isSubmitting}
            />
          </label>

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-brown-700/10 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-black text-brown-700 transition hover:bg-cream-100 disabled:opacity-60"
            disabled={isSubmitting}
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
              isReject ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isReject ? 'Từ chối kết quả' : 'Phê duyệt kết quả'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SubmissionDetail({ submission, isLoading, error, onBack, onRetry, onApprove, onReject }) {
  if (isLoading) {
    return (
      <section className="rounded-lg border border-white/80 bg-cream-100/90 p-10 text-center shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
        <Loader2 className="mx-auto animate-spin text-brown-700" size={32} />
        <p className="mt-4 font-bold text-slate-500">Đang tải chi tiết submission...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-rose-200 bg-rose-50 p-6 shadow-[0_12px_34px_rgba(185,28,28,0.08)]">
        <h3 className="text-lg font-black text-rose-800">Không thể tải chi tiết kết quả</h3>
        <p className="mt-2 font-semibold text-rose-700">{error}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-black text-white shadow-[0_8px_18px_rgba(185,28,28,0.12)]" type="button" onClick={onRetry}>
            Thử lại
          </button>
          <button className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)]" type="button" onClick={onBack}>
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
      <div className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
        <header className="flex flex-col gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.78))] p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">Submission #{submission.submissionId}</p>
            <h2 className="mt-2 text-2xl font-black text-brown-900">{submission.raceName}</h2>
            <p className="mt-1 font-semibold text-slate-500">{submission.tournamentName} · {submission.trackName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="min-h-10 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-black text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)] transition hover:-translate-y-0.5 hover:bg-cream-100" type="button" onClick={onBack}>
              Quay lại
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 shadow-[0_8px_18px_rgba(185,28,28,0.06)] transition hover:-translate-y-0.5 hover:bg-rose-100" type="button" onClick={onReject}>
              <ShieldAlert size={16} />
              Từ chối kết quả
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(5,150,105,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-800" type="button" onClick={onApprove}>
              <CheckCircle2 size={16} />
              Phê duyệt kết quả
            </button>
          </div>
        </header>

        <div className="grid gap-4 p-5 lg:grid-cols-4">
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Status Submission</span>
            <div className="mt-2"><ReviewStatusBadge status={submission.status} /></div>
          </div>
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Thời gian Race</span>
            <strong className="mt-2 block text-brown-900">{formatReviewDateTime(submission.raceStartTime)}</strong>
          </div>
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Thời gian gửi</span>
            <strong className="mt-2 block text-brown-900">{formatReviewDateTime(submission.submittedAt)}</strong>
          </div>
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Số Horse</span>
            <strong className="mt-2 block text-brown-900">{submission.entries.length}</strong>
          </div>
        </div>

        <div className="border-t border-brown-700/10 p-5">
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_12px_28px_rgba(78,44,25,0.08)]">
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">Quyết định Referee</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <ReviewStatusBadge status={submission.status} />
              <span className="font-bold text-slate-500">
                {submission.refereeReviewedAt ? formatReviewDateTime(submission.refereeReviewedAt) : latestRefereeAction ? formatReviewDateTime(latestRefereeAction.createdAt) : 'Chưa có thời gian review'}
              </span>
            </div>
            <p className="mt-3 font-semibold text-slate-600">
              {submission.refereeComment || latestRefereeAction?.comment || 'Referee không để lại ghi chú.'}
            </p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.1)]">
        <div className="flex flex-col gap-2 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.72))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-brown-900">Danh sách RaceEntry</h3>
            <p className="text-sm font-semibold text-slate-500">Kết quả provisional đã qua bước Referee review.</p>
          </div>
          <span className="rounded-full border border-brown-700/10 bg-white px-3 py-1 text-sm font-black text-brown-700 shadow-[0_6px_16px_rgba(78,44,25,0.06)]">{submission.entries.length} Horse</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[62rem] w-full table-fixed text-left">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[22%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[7%]" />
            </colgroup>
            <thead className="bg-cream-200/55">
              <tr className="border-b border-brown-700/10 text-xs font-black uppercase tracking-wide text-brown-700">
                <th className="px-5 py-3">Thứ hạng</th>
                <th className="px-5 py-3">Horse</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Jockey</th>
                <th className="px-5 py-3">Vị trí xuất phát</th>
                <th className="px-5 py-3">Thời gian về đích</th>
                <th className="px-5 py-3">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {submission.entries.map((entry) => (
                <tr className="border-b border-brown-700/10 bg-white/55 last:border-b-0 hover:bg-white" key={entry.id}>
                  <td className="px-5 py-4">
                    <span className="inline-grid size-10 place-items-center rounded-lg bg-cream-200 text-base font-black text-brown-700">#{entry.finishPosition}</span>
                  </td>
                  <td className="px-5 py-4">
                    <strong className="block truncate text-brown-900">{entry.horseName}</strong>
                    <span className="text-xs font-bold text-slate-500">RaceEntry #{entry.raceEntryId || 'N/A'}</span>
                  </td>
                  <td className="truncate px-5 py-4 font-bold text-brown-900">{entry.ownerName}</td>
                  <td className="truncate px-5 py-4 font-bold text-brown-900">{entry.jockeyName}</td>
                  <td className="px-5 py-4 font-black text-brown-900">{entry.startingStall || 'N/A'}</td>
                  <td className="px-5 py-4 font-black text-brown-900">{entry.finishTime}</td>
                  <td className="px-5 py-4 font-black text-brown-900">{entry.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-white/80 bg-cream-100/90 p-5 shadow-[0_20px_52px_rgba(78,44,25,0.1)]">
        <div className="flex items-center gap-2">
          <History size={18} className="text-brown-500" />
          <h3 className="text-lg font-black text-brown-900">Lịch sử review</h3>
        </div>
        {submission.reviewActions.length === 0 ? (
          <p className="mt-4 rounded-lg border border-white/80 bg-white p-4 font-semibold text-slate-500">Chưa có lịch sử review.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {submission.reviewActions.map((action) => (
              <article className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]" key={action.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <ReviewStatusBadge status={action.action} />
                  <strong className="text-brown-900">{action.actorRole || 'Reviewer'} #{action.actorUserId || 'N/A'}</strong>
                  <span className="text-sm font-semibold text-slate-500">{formatReviewDateTime(action.createdAt)}</span>
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
      setListError(getReviewErrorText(error, 'Không thể tải review queue.'));
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
      setDetailError(getReviewErrorText(error, 'Không thể tải chi tiết submission.'));
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
        window.dispatchEvent(new CustomEvent('admin-event:race-result-rejected', {
          detail: { raceId: detail.raceId, submissionId: detail.submissionId }
        }));
        returnToQueue('Kết quả đã bị từ chối. Race đã được đưa về READY để chạy lại.');
      } else {
        await approveRaceResultSubmission(detail.submissionId, reason);
        returnToQueue('Đã phê duyệt kết quả.');
      }
    } catch (error) {
      setDecisionError(getReviewErrorText(error, 'Không thể cập nhật quyết định Admin.'));
    } finally {
      setIsSubmittingDecision(false);
    }
  }

  if (selectedId) {
    return (
      <section className="space-y-5 text-brown-900">
        {toast && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-[0_8px_24px_rgba(5,150,105,0.1)]">{toast}</div>}
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
      </section>
    );
  }

  return (
    <section className="space-y-5 text-brown-900">
      <header className="flex flex-col gap-4 border-b border-brown-700/10 pb-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-brown-500">
            <span className="h-px w-7 bg-brown-500" /> Admin
          </div>
          <h1 className="mt-2 text-3xl font-black leading-none text-brown-900 md:text-4xl">
            Duyệt kết quả Race
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-500">
            Kiểm tra kết quả đã qua Referee review, phê duyệt RaceResult chính thức hoặc trả Race về READY để chạy lại.
          </p>
        </div>
        <button
          type="button"
          onClick={loadReviewQueue}
          disabled={isLoadingList}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-extrabold text-brown-700 shadow-[0_10px_24px_rgba(78,44,25,0.08)] transition hover:-translate-y-0.5 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoadingList ? <Loader2 size={17} className="animate-spin" /> : <RefreshCw size={17} strokeWidth={2.5} />}
          {isLoadingList ? 'Đang làm mới' : 'Làm mới'}
        </button>
      </header>

      {toast && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-[0_8px_24px_rgba(5,150,105,0.1)]">{toast}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Trophy} label="Hàng chờ review" value={submissions.length} note="Submission đã qua Referee" />
        <MetricCard icon={CheckCircle2} label="Referee đã xác nhận" value={confirmedCount} note="Sẵn sàng phê duyệt" />
        <MetricCard icon={AlertTriangle} label="Referee đã flag" value={flaggedCount} note="Cần Admin kiểm tra" />
      </section>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
        <header className="flex flex-col gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.78))] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">Duyệt kết quả Race</p>
            <h2 className="mt-1 text-2xl font-black text-brown-900">Hàng chờ Admin review</h2>
            <p className="mt-1 font-semibold text-slate-500">Phê duyệt hoặc từ chối kết quả đã qua bước Referee review.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="min-h-11 w-full rounded-lg border border-brown-700/15 bg-white pl-10 pr-4 text-sm font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-brown-500/10 sm:w-80"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm Tournament, Race, đường đua..."
              />
            </label>
          </div>
        </header>

        {listError && (
          <div className="m-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-[0_8px_24px_rgba(185,28,28,0.08)]">
            {listError}
            {submissions.length > 0 && (
              <p className="mt-1 text-xs font-extrabold text-rose-800">
                Dữ liệu review queue bên dưới có thể chưa được cập nhật.
              </p>
            )}
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
            <table className="min-w-[76rem] w-full table-fixed text-left">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[17%]" />
                <col className="w-[16%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-cream-200/55">
                <tr className="border-b border-brown-700/10 text-xs font-black uppercase tracking-wide text-brown-700">
                  <th className="px-5 py-3">Mã Submission</th>
                  <th className="px-5 py-3">Tournament</th>
                  <th className="px-5 py-3">Race</th>
                  <th className="px-5 py-3">Đường đua</th>
                  <th className="px-5 py-3">Thời gian gửi</th>
                  <th className="px-5 py-3">Status Referee</th>
                  <th className="px-5 py-3 text-center">Số Horse</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr className="border-b border-brown-700/10 bg-white/55 last:border-b-0 hover:bg-white" key={submission.submissionId}>
                    <td className="px-5 py-4 font-black text-brown-900">#{submission.submissionId}</td>
                    <td className="px-5 py-4">
                      <strong className="block truncate text-brown-900">{submission.tournamentName}</strong>
                      <span className="text-xs font-bold text-slate-500">ID #{submission.tournamentId || 'N/A'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <strong className="block truncate text-brown-900">{submission.raceName}</strong>
                      <span className="text-xs font-bold text-slate-500">Race #{submission.raceId || 'N/A'}</span>
                    </td>
                    <td className="truncate px-5 py-4 font-bold text-brown-900">{submission.trackName}</td>
                    <td className="px-5 py-4 font-bold text-brown-900">{formatReviewDateTime(submission.submittedAt)}</td>
                    <td className="px-5 py-4"><ReviewStatusBadge status={submission.status} /></td>
                    <td className="px-5 py-4 text-center font-black text-brown-900">{submission.horseCount}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => loadDetail(submission.submissionId)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-black text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)] transition hover:-translate-y-0.5 hover:border-brown-500 hover:bg-cream-100"
                      >
                        <Eye size={16} />
                        Duyệt
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
