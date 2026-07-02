import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Flag,
  Loader2,
  RefreshCw,
  Search,
  Trophy,
  X
} from 'lucide-react';
import {
  adaptRaceResultSubmissionDetail,
  adaptRaceResultSubmissionSummary
} from '../../adapters/raceResultSubmissionAdapter';
import {
  confirmRaceResultSubmission,
  flagRaceResultSubmission,
  getPendingRaceResultSubmissions,
  getRaceResultSubmissionDetail
} from '../../services/refereeRaceResultReviewService';
import {
  formatReviewDateTime,
  getReviewErrorText,
  ReviewStatusBadge
} from '../common/raceResultReviewUi';

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <article className="rounded-lg border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,248,238,0.86))] p-4 shadow-[0_12px_32px_rgba(78,44,25,0.08)]">
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
    <section className="rounded-lg border border-dashed border-brown-700/20 bg-white/80 p-10 text-center shadow-[0_10px_28px_rgba(78,44,25,0.06)]">
      <div className="mx-auto grid size-14 place-items-center rounded-lg bg-cream-200 text-brown-700">
        <CheckCircle2 size={26} />
      </div>
      <h3 className="mt-4 text-xl font-black text-brown-900">Không có kết quả đang chờ duyệt</h3>
      <p className="mx-auto mt-2 max-w-2xl font-semibold text-slate-500">
        Khi Unity gửi kết quả mới cho Race mà bạn được phân công, submission sẽ xuất hiện tại đây.
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

function ReviewDialog({
  mode,
  submission,
  comment,
  onCommentChange,
  error,
  isSubmitting,
  onClose,
  onSubmit
}) {
  if (!mode || !submission) return null;

  const isFlag = mode === 'flag';

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-xl overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-white/75 p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">
              {isFlag ? 'Flag kết quả' : 'Xác nhận kết quả'}
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
          <div className={`rounded-lg border p-4 ${isFlag ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <p className="text-sm font-bold">
              {isFlag
                ? 'Nhập lý do để báo lỗi kết quả này cho Admin.'
                : 'Bạn có thể để lại ghi chú tùy chọn trước khi xác nhận kết quả.'}
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-brown-900">
              {isFlag ? 'Lý do flag' : 'Ghi chú'}
              {isFlag && <span className="text-rose-600"> *</span>}
            </span>
            <textarea
              className="min-h-32 rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-semibold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-brown-500/10"
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder={isFlag ? 'Mô tả vấn đề cần Admin kiểm tra...' : 'Ghi chú cho Admin nếu cần...'}
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
              isFlag ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isFlag ? 'Flag kết quả' : 'Xác nhận kết quả'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SubmissionDetail({ submission, onBack, onConfirm, onFlag, isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <section className="rounded-lg border border-white/80 bg-white/85 p-10 text-center shadow-[0_12px_32px_rgba(78,44,25,0.08)]">
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
            Quay lại danh sách
          </button>
        </div>
      </section>
    );
  }

  if (!submission) return null;

  return (
    <section className="grid gap-5">
      <div className="overflow-hidden rounded-lg border border-white/80 bg-white/85 shadow-[0_16px_44px_rgba(43,23,16,0.08)]">
        <header className="flex flex-col gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(247,234,216,0.58))] p-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">Submission #{submission.submissionId}</p>
            <h2 className="mt-2 text-2xl font-black text-brown-900">{submission.raceName}</h2>
            <p className="mt-1 font-semibold text-slate-500">{submission.tournamentName} · {submission.trackName}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="min-h-10 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-black text-brown-700 hover:bg-cream-100" type="button" onClick={onBack}>
              Quay lại
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 hover:bg-rose-100" type="button" onClick={onFlag}>
              <Flag size={16} />
              Flag kết quả
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-800" type="button" onClick={onConfirm}>
              <CheckCircle2 size={16} />
              Xác nhận kết quả
            </button>
          </div>
        </header>

        <div className="grid gap-4 p-5 lg:grid-cols-4">
          <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Status</span>
            <div className="mt-2"><ReviewStatusBadge status={submission.status} /></div>
          </div>
          <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Thời gian Race</span>
            <strong className="mt-2 block text-brown-900">{formatReviewDateTime(submission.raceStartTime)}</strong>
          </div>
          <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Thời gian gửi</span>
            <strong className="mt-2 block text-brown-900">{formatReviewDateTime(submission.submittedAt)}</strong>
          </div>
          <div className="rounded-lg border border-brown-700/10 bg-cream-100 p-4">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Referee</span>
            <strong className="mt-2 block text-brown-900">{submission.refereeName}</strong>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-white/85 shadow-[0_12px_32px_rgba(78,44,25,0.08)]">
        <div className="flex flex-col gap-2 border-b border-brown-700/10 bg-cream-100/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-brown-900">Danh sách RaceEntry</h3>
            <p className="text-sm font-semibold text-slate-500">Kết quả provisional từ Unity, chờ referee duyệt.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-brown-700">{submission.entries.length} horses</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[62rem] w-full text-left">
            <thead>
              <tr className="border-b border-brown-700/10 bg-cream-200/65 text-xs font-black uppercase tracking-wide text-brown-700">
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

      {submission.reviewActions.length > 0 && (
        <section className="rounded-lg border border-white/80 bg-white/80 p-5 shadow-[0_12px_32px_rgba(78,44,25,0.08)]">
          <h3 className="text-lg font-black text-brown-900">Lịch sử review</h3>
          <div className="mt-4 grid gap-3">
            {submission.reviewActions.map((action) => (
              <article className="rounded-lg border border-brown-700/10 bg-cream-100 p-4" key={action.id}>
                <div className="flex flex-wrap items-center gap-2">
                  <ReviewStatusBadge status={action.action} />
                  <strong className="text-brown-900">{action.actorRole || 'Reviewer'} #{action.actorUserId || 'N/A'}</strong>
                  <span className="text-sm font-semibold text-slate-500">{formatReviewDateTime(action.createdAt)}</span>
                </div>
                {action.comment && <p className="mt-2 font-semibold text-slate-600">{action.comment}</p>}
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}

export default function RefereeResultReview() {
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
  const [reviewComment, setReviewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const filteredSubmissions = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return submissions;

    return submissions.filter((submission) => [
      submission.submissionId,
      submission.tournamentName,
      submission.raceName,
      submission.trackName,
      submission.status
    ].some((value) => String(value || '').toLowerCase().includes(keyword)));
  }, [query, submissions]);

  async function loadPendingSubmissions() {
    setIsLoadingList(true);
    setListError('');

    try {
      const data = await getPendingRaceResultSubmissions();
      setSubmissions(Array.isArray(data) ? data.map(adaptRaceResultSubmissionSummary) : []);
    } catch (error) {
      setListError(getReviewErrorText(error, 'Không thể tải danh sách kết quả chờ duyệt.'));
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
      const data = await getRaceResultSubmissionDetail(submissionId);
      setDetail(adaptRaceResultSubmissionDetail(data));
    } catch (error) {
      setDetailError(getReviewErrorText(error, 'Không thể tải chi tiết submission.'));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  useEffect(() => {
    loadPendingSubmissions();
  }, []);

  function returnToList(message = '') {
    setSelectedId(null);
    setDetail(null);
    setDetailError('');
    setDialogMode(null);
    setReviewComment('');
    setReviewError('');
    if (message) setToast(message);
    loadPendingSubmissions();
  }

  function openReviewDialog(mode) {
    setDialogMode(mode);
    setReviewComment('');
    setReviewError('');
  }

  function closeReviewDialog() {
    if (isSubmittingReview) return;
    setDialogMode(null);
    setReviewComment('');
    setReviewError('');
  }

  async function submitReview() {
    if (!detail) return;

    const reason = reviewComment.trim();
    if (dialogMode === 'flag' && !reason) {
      setReviewError('Vui lòng nhập lý do flag kết quả.');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      if (dialogMode === 'flag') {
        await flagRaceResultSubmission(detail.submissionId, reason);
        returnToList('Đã flag kết quả.');
      } else {
        await confirmRaceResultSubmission(detail.submissionId, reason);
        returnToList('Đã xác nhận kết quả.');
      }
    } catch (error) {
      setReviewError(getReviewErrorText(error, 'Không thể cập nhật trạng thái review.'));
    } finally {
      setIsSubmittingReview(false);
    }
  }

  if (selectedId) {
    return (
      <>
        {toast && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{toast}</div>}
        <SubmissionDetail
          submission={detail}
          onBack={() => returnToList()}
          onConfirm={() => openReviewDialog('confirm')}
          onFlag={() => openReviewDialog('flag')}
          isLoading={isLoadingDetail}
          error={detailError}
          onRetry={() => loadDetail(selectedId)}
        />
        <ReviewDialog
          mode={dialogMode}
          submission={detail}
          comment={reviewComment}
          onCommentChange={setReviewComment}
          error={reviewError}
          isSubmitting={isSubmittingReview}
          onClose={closeReviewDialog}
          onSubmit={submitReview}
        />
      </>
    );
  }

  return (
    <section className="grid gap-5">
      {toast && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{toast}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Trophy} label="Submission chờ duyệt" value={submissions.length} note="Chỉ Status SUBMITTED" />
        <MetricCard icon={Clock3} label="Submission mới nhất" value={submissions[0] ? formatReviewDateTime(submissions[0].submittedAt) : 'N/A'} note="Thời gian gửi" />
        <MetricCard icon={AlertTriangle} label="Cần xử lý" value={submissions.length} note="Xác nhận hoặc flag" />
      </section>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-white/85 shadow-[0_16px_44px_rgba(43,23,16,0.08)]">
        <header className="flex flex-col gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(247,234,216,0.58))] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">Duyệt kết quả Referee</p>
            <h2 className="mt-1 text-2xl font-black text-brown-900">Danh sách chờ duyệt</h2>
            <p className="mt-1 font-semibold text-slate-500">Duyệt kết quả provisional do Unity gửi trước khi Admin phê duyệt chính thức.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="min-h-11 w-full rounded-lg border border-brown-700/15 bg-white pl-10 pr-4 text-sm font-bold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-brown-500/10 sm:w-72"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm Tournament, Race, đường đua..."
              />
            </label>
            <button
              type="button"
              onClick={loadPendingSubmissions}
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
            {submissions.length > 0 && (
              <p className="mt-1 text-xs font-extrabold text-rose-800">
                Dữ liệu submission bên dưới có thể chưa được cập nhật.
              </p>
            )}
          </div>
        )}

        {isLoadingList ? (
          <div className="grid place-items-center p-12">
            <Loader2 className="animate-spin text-brown-700" size={32} />
            <p className="mt-4 font-bold text-slate-500">Đang tải pending submissions...</p>
          </div>
        ) : submissions.length === 0 && !listError ? (
          <div className="p-5">
            <EmptyState onRefresh={loadPendingSubmissions} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[68rem] w-full text-left">
              <thead>
                <tr className="border-b border-brown-700/10 bg-cream-200/65 text-xs font-black uppercase tracking-wide text-brown-700">
                  <th className="px-5 py-3">Mã Submission</th>
                  <th className="px-5 py-3">Tournament</th>
                  <th className="px-5 py-3">Race</th>
                  <th className="px-5 py-3">Đường đua</th>
                  <th className="px-5 py-3">Thời gian Race</th>
                  <th className="px-5 py-3">Thời gian gửi</th>
                  <th className="px-5 py-3">Status Submission</th>
                  <th className="px-5 py-3">Số Horse</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
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
                    <td className="px-5 py-4 font-bold text-brown-900">{formatReviewDateTime(submission.raceStartTime)}</td>
                    <td className="px-5 py-4 font-bold text-brown-900">{formatReviewDateTime(submission.submittedAt)}</td>
                    <td className="px-5 py-4"><ReviewStatusBadge status={submission.status} /></td>
                    <td className="px-5 py-4 font-black text-brown-900">{submission.horseCount}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => loadDetail(submission.submissionId)}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-black text-brown-700 shadow-sm hover:bg-cream-100"
                      >
                        <Eye size={16} />
                        Xem xét
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
