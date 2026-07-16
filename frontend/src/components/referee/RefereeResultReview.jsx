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
import { useLanguage } from '../../context/LanguageContext';

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
  const { t } = useLanguage();

  return (
    <section className="rounded-lg border border-dashed border-brown-700/20 bg-white/75 p-10 text-center shadow-[0_10px_30px_rgba(78,44,25,0.06)]">
      <div className="mx-auto grid size-14 place-items-center rounded-lg bg-cream-200 text-brown-700">
        <CheckCircle2 size={26} />
      </div>
      <h3 className="mt-4 text-xl font-black text-brown-900">{t('refereeResultReviewNoPendingTitle')}</h3>
      <p className="mx-auto mt-2 max-w-2xl font-semibold text-slate-500">
        {t('refereeResultReviewNoPendingHint')}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-black text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)] transition hover:-translate-y-0.5 hover:bg-cream-100"
      >
        <RefreshCw size={16} />
        {t('eventCommonRefresh')}
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
  const { t } = useLanguage();
  if (!mode || !submission) return null;

  const isFlag = mode === 'flag';

  return (
    <div className="fixed inset-0 z-[1200] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section className="w-full max-w-xl overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.88))] p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">
              {isFlag ? t('refereeResultReviewFlag') : t('refereeResultReviewConfirm')}
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
            aria-label={t('eventCommonClose')}
          >
            <X size={18} />
          </button>
        </header>

        <div className="grid gap-4 p-6">
          <div className={`rounded-lg border p-4 shadow-[0_8px_22px_rgba(78,44,25,0.05)] ${isFlag ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
            <p className="text-sm font-bold leading-6">
              {isFlag
                ? t('refereeResultReviewFlagNote')
                : t('refereeResultReviewConfirmNote')}
            </p>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-black text-brown-900">
              {isFlag ? t('refereeResultReviewFlagReason') : t('refereeResultReviewCommentLabel')}
              {isFlag && <span className="text-rose-600"> *</span>}
            </span>
            <textarea
              className="min-h-32 rounded-lg border border-brown-700/15 bg-white px-4 py-3 text-sm font-semibold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-brown-500/10"
              value={comment}
              onChange={(event) => onCommentChange(event.target.value)}
              placeholder={isFlag ? t('refereeResultReviewFlagPlaceholder') : t('refereeResultReviewCommentPlaceholder')}
              disabled={isSubmitting}
            />
          </label>

          {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-[0_8px_24px_rgba(185,28,28,0.08)]">{error}</div>}
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-brown-700/10 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-brown-700/15 bg-white px-5 text-sm font-black text-brown-700 transition hover:bg-cream-100 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {t('eventCommonClose')}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${
              isFlag ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isFlag ? t('refereeResultReviewFlag') : t('refereeResultReviewConfirm')}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SubmissionDetail({ submission, onBack, onConfirm, onFlag, isLoading, error, onRetry }) {
  const { t } = useLanguage();

  // FLOW: Referee Review Detail
  // Displays the provisional finish order and review history loaded for the assigned Referee.
  if (isLoading) {
    return (
      <section className="rounded-lg border border-white/80 bg-cream-100/90 p-10 text-center shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
        <Loader2 className="mx-auto animate-spin text-brown-700" size={32} />
        <p className="mt-4 font-bold text-slate-500">{t('refereeResultReviewLoadingDetail')}</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-rose-200 bg-rose-50 p-6 shadow-[0_12px_34px_rgba(185,28,28,0.08)]">
        <h3 className="text-lg font-black text-rose-800">{t('refereeResultReviewDetailLoadError')}</h3>
        <p className="mt-2 font-semibold text-rose-700">{error}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-black text-white shadow-[0_8px_18px_rgba(185,28,28,0.12)]" type="button" onClick={onRetry}>
            {t('eventCommonRetry')}
          </button>
          <button className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-black text-rose-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)]" type="button" onClick={onBack}>
            {t('eventCommonClose')}
          </button>
        </div>
      </section>
    );
  }

  if (!submission) return null;

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
              {t('eventCommonClose')}
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700 shadow-[0_8px_18px_rgba(185,28,28,0.06)] transition hover:-translate-y-0.5 hover:bg-rose-100" type="button" onClick={onFlag}>
              <Flag size={16} />
              {t('refereeResultReviewFlag')}
            </button>
            <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(5,150,105,0.18)] transition hover:-translate-y-0.5 hover:bg-emerald-800" type="button" onClick={onConfirm}>
              <CheckCircle2 size={16} />
              {t('refereeResultReviewConfirm')}
            </button>
          </div>
        </header>

        <div className="grid gap-4 p-5 lg:grid-cols-4">
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Status</span>
            <div className="mt-2"><ReviewStatusBadge status={submission.status} /></div>
          </div>
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">{t('refereeResultReviewRaceTime')}</span>
            <strong className="mt-2 block text-brown-900">{formatReviewDateTime(submission.raceStartTime)}</strong>
          </div>
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">{t('resultReviewSubmissionTime')}</span>
            <strong className="mt-2 block text-brown-900">{formatReviewDateTime(submission.submittedAt)}</strong>
          </div>
          <div className="rounded-lg border border-white/80 bg-white p-4 shadow-[0_10px_24px_rgba(78,44,25,0.06)]">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">Referee</span>
            <strong className="mt-2 block text-brown-900">{submission.refereeName}</strong>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.1)]">
        <div className="flex flex-col gap-2 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.72))] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-brown-900">RaceEntry</h3>
            <p className="text-sm font-semibold text-slate-500">{t('refereeResultReviewProvisionalEntriesHint')}</p>
          </div>
          <span className="rounded-full border border-brown-700/10 bg-white px-3 py-1 text-sm font-black text-brown-700 shadow-[0_6px_16px_rgba(78,44,25,0.06)]">{submission.entries.length} Horse</span>
        </div>

        <div className="overflow-hidden">
          <table className="w-full table-fixed text-left">
            <colgroup>
              <col className="w-[11%]" />
              <col className="w-[24%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              <col className="w-[14%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead className="bg-cream-200/55">
              <tr className="border-b border-brown-700/10 text-xs font-black uppercase tracking-wide text-brown-700">
                <th className="px-5 py-3">{t('eventCommonRank')}</th>
                <th className="px-5 py-3">Horse</th>
                <th className="px-5 py-3">Owner</th>
                <th className="px-5 py-3">Jockey</th>
                <th className="px-5 py-3">{t('resultReviewStartingStall')}</th>
                <th className="px-5 py-3">{t('resultReviewFinishTime')}</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {submission.reviewActions.length > 0 && (
        <section className="rounded-lg border border-white/80 bg-cream-100/90 p-5 shadow-[0_20px_52px_rgba(78,44,25,0.1)]">
          <h3 className="text-lg font-black text-brown-900">{t('resultReviewReviewHistory')}</h3>
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
        </section>
      )}
    </section>
  );
}

function SubmissionDetailModal({ open, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <section
        className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_34px_100px_rgba(43,23,16,0.48)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="max-h-[92vh] overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </section>
    </div>
  );
}

export default function RefereeResultReview() {
  const { t } = useLanguage();
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
    // FLOW: Referee Review Queue
    // ORDER: 2/7 - Page loader fetches pending submissions and stores adapted list rows.
    // FE path: Referee Dashboard -> Result Review -> GET /pending.
    // Purpose: show only SUBMITTED provisional results assigned to this referee.
    setIsLoadingList(true);
    setListError('');

    try {
      const data = await getPendingRaceResultSubmissions();
      setSubmissions(Array.isArray(data) ? data.map(adaptRaceResultSubmissionSummary) : []);
    } catch (error) {
      setListError(getReviewErrorText(error, t('refereeResultReviewListFallback')));
    } finally {
      setIsLoadingList(false);
    }
  }

  async function loadDetail(submissionId) {
    // FLOW: Referee Review Detail
    // ORDER: 1/8 - Queue Review action selects a submission and starts detail loading.
    // FE path: Result Review queue -> Review button -> GET submission detail.
    setSelectedId(submissionId);
    setDetail(null);
    setDetailError('');
    setToast('');
    setIsLoadingDetail(true);

    try {
      const data = await getRaceResultSubmissionDetail(submissionId);
      setDetail(adaptRaceResultSubmissionDetail(data));
    } catch (error) {
      setDetailError(getReviewErrorText(error, t('refereeResultReviewDetailFallback')));
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

  function closeDetailModal() {
    if (isSubmittingReview) return;
    setSelectedId(null);
    setDetail(null);
    setDetailError('');
    setDialogMode(null);
    setReviewComment('');
    setReviewError('');
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
      // FLOW: Referee Flag Result
      // ORDER: 1/6 - Frontend blocks flag submission until Referee enters a non-empty reason.
      // FE validation: flagging a provisional result requires a non-empty reason.
      setReviewError(t('refereeResultReviewFlagRequired'));
      return;
    }

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      if (dialogMode === 'flag') {
        // FLOW: Referee Flag Result
        // ORDER: 2/6 - Referee flag dialog submits required reason for the selected provisional result.
        // FE action: required reason -> PUT /flag -> submission leaves Referee pending queue.
        await flagRaceResultSubmission(detail.submissionId, reason);
        returnToList(t('refereeResultReviewFlagged'));
      } else {
        // FLOW: Referee Confirm Result
        // ORDER: 1/6 - Referee confirm dialog submits optional comment for the selected provisional result.
        // FE action: optional comment -> PUT /confirm -> submission leaves Referee pending queue.
        await confirmRaceResultSubmission(detail.submissionId, reason);
        returnToList(t('refereeResultReviewConfirmed'));
      }
    } catch (error) {
      setReviewError(getReviewErrorText(error, t('refereeResultReviewUpdateError')));
    } finally {
      setIsSubmittingReview(false);
    }
  }

  return (
    <section className="space-y-5 text-brown-900">
      {toast && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-[0_8px_24px_rgba(5,150,105,0.1)]">{toast}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Trophy} label={t('refereeResultReviewPendingMetric')} value={submissions.length} note={t('refereeResultReviewSubmittedOnly')} />
        <MetricCard icon={Clock3} label={t('refereeResultReviewLatestMetric')} value={submissions[0] ? formatReviewDateTime(submissions[0].submittedAt) : 'N/A'} note={t('resultReviewSubmissionTime')} />
        <MetricCard icon={AlertTriangle} label={t('refereeResultReviewNeedsAction')} value={submissions.length} note={t('refereeResultReviewActionNote')} />
      </section>

      <section className="overflow-hidden rounded-lg border border-white/80 bg-cream-100/90 shadow-[0_20px_52px_rgba(78,44,25,0.12)]">
        <header className="flex flex-col gap-4 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,248,238,0.96),rgba(247,234,216,0.78))] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brown-500">{t('refereeResultReviewTitle')}</p>
            <h2 className="mt-1 text-2xl font-black text-brown-900">{t('refereeResultReviewQueueTitle')}</h2>
            <p className="mt-1 font-semibold text-slate-500">{t('refereeResultReviewQueueSubtitle')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                className="min-h-11 w-full rounded-lg border border-brown-700/15 bg-white pl-10 pr-4 text-sm font-bold text-brown-900 shadow-[0_8px_20px_rgba(78,44,25,0.06)] outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-brown-500/10 sm:w-80"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('refereeResultReviewSearchPlaceholder')}
              />
            </label>
            <button
              type="button"
              onClick={loadPendingSubmissions}
              disabled={isLoadingList}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brown-700 px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(108,63,36,0.24)] transition hover:-translate-y-0.5 hover:bg-brown-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingList ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {t('eventCommonRefresh')}
            </button>
          </div>
        </header>

        {listError && (
          <div className="m-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 shadow-[0_8px_24px_rgba(185,28,28,0.08)]">
            {listError}
            {submissions.length > 0 && (
              <p className="mt-1 text-xs font-extrabold text-rose-800">
                {t('refereeResultReviewStaleData')}
              </p>
            )}
          </div>
        )}

        {isLoadingList ? (
          <div className="grid place-items-center p-12">
            <Loader2 className="animate-spin text-brown-700" size={32} />
            <p className="mt-4 font-bold text-slate-500">{t('refereeResultReviewLoadingPending')}</p>
          </div>
        ) : submissions.length === 0 && !listError ? (
          <div className="p-5">
            <EmptyState onRefresh={loadPendingSubmissions} />
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead className="bg-cream-200/55">
                <tr className="border-b border-brown-700/10 text-xs font-black uppercase tracking-wide text-brown-700">
                  <th className="px-5 py-3">{t('refereeResultReviewSubmissionCode')}</th>
                  <th className="px-5 py-3">Tournament</th>
                  <th className="px-5 py-3">Race</th>
                  <th className="px-5 py-3">{t('resultReviewTrack')}</th>
                  <th className="px-5 py-3">{t('refereeResultReviewRaceTime')}</th>
                  <th className="px-5 py-3">{t('resultReviewSubmissionTime')}</th>
                  <th className="px-5 py-3">Status Submission</th>
                  <th className="px-5 py-3 text-center">{t('resultReviewHorseCount')}</th>
                  <th className="px-5 py-3 text-right">{t('eventCommonActions')}</th>
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
                    <td className="px-5 py-4 font-bold text-brown-900">{formatReviewDateTime(submission.raceStartTime)}</td>
                    <td className="px-5 py-4 font-bold text-brown-900">{formatReviewDateTime(submission.submittedAt)}</td>
                    <td className="px-5 py-4"><ReviewStatusBadge status={submission.status} /></td>
                    <td className="px-5 py-4 text-center font-black text-brown-900">{submission.horseCount}</td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => loadDetail(submission.submissionId)}
                        className="inline-grid size-10 place-items-center rounded-lg border border-brown-700/15 bg-white text-brown-700 shadow-[0_8px_18px_rgba(78,44,25,0.06)] transition hover:-translate-y-0.5 hover:border-brown-500 hover:bg-cream-100"
                        aria-label={t('refereeResultReviewReviewActionAria', { id: submission.submissionId })}
                        title={t('refereeResultReviewReviewActionTitle')}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSubmissions.length === 0 && (
              <div className="p-8 text-center">
                <p className="font-bold text-slate-500">{t('refereeResultReviewSearchEmpty')}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <SubmissionDetailModal open={Boolean(selectedId)} onClose={closeDetailModal}>
        {/* FLOW: Referee Review Detail */}
        {/* ORDER: 8/8 - Modal renders provisional entries and review history after detail DTO is adapted. */}
        <SubmissionDetail
          submission={detail}
          onBack={closeDetailModal}
          onConfirm={() => openReviewDialog('confirm')}
          onFlag={() => openReviewDialog('flag')}
          isLoading={isLoadingDetail}
          error={detailError}
          onRetry={() => loadDetail(selectedId)}
        />
      </SubmissionDetailModal>

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
    </section>
  );
}

