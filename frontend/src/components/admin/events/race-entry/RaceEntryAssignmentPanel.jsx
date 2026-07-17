import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Flag, Image as ImageIcon, LoaderCircle, Medal, PlayCircle, Radio, RefreshCw, Trophy, UserPlus, XCircle } from 'lucide-react';
import AssignmentDialog from './AssignmentDialog';
import CancellationDialog from './CancellationDialog';
import OfficialEntries from './OfficialEntries';
import PrizeRuleDialog from './PrizeRuleDialog';
import RaceResultPrizeDialog from './RaceResultPrizeDialog';
import RaceLiveView from '../../../shared/live/RaceLiveView';
import useRaceEntryAssignment from './useRaceEntryAssignment';
import ImagePreviewDialog from '../ImagePreviewDialog';
import TournamentStatusBadge from '../TournamentStatusBadge';
import { failRaceRun, readyRace, runRace } from '../../../../services/eventService';
import { formatRaceSchedule } from '../../../../lib/eventFormatters';
import { useLanguage } from '../../../../context/LanguageContext';

const RACE_ENTRY_EDITABLE_STATUSES = new Set(['OPEN_FOR_REGISTRATION', 'REGISTRATION_CLOSED']);
const MIN_RACE_ENTRIES_TO_LAUNCH = 3;

function getRaceEntryLockReason(status, t) {
  const messageKeys = {
    READY: 'eventRaceEntryReadyLock',
    IN_PROGRESS: 'eventRaceEntryInProgressLock',
    PENDING_REVIEW: 'eventRaceEntryPendingReviewLock',
    COMPLETED: 'eventRaceEntryCompletedLock',
    CANCELLED: 'eventRaceEntryCancelledLock'
  };

  return t(messageKeys[status] || 'eventRaceEntryDefaultLock');
}

export default function RaceEntryAssignmentPanel({ tournament, onRaceEntryCountChange, onRaceStatusChange, onNavigateToResultReview, queueRefreshKey }) {
  const { t } = useLanguage();
  const [selectedRaceId, setSelectedRaceId] = useState(tournament.races[0]?.id || null);
  const [assignmentRace, setAssignmentRace] = useState(null);
  const [cancellationEntry, setCancellationEntry] = useState(null);
  const [prizeRuleRace, setPrizeRuleRace] = useState(null);
  const [resultPrizeRace, setResultPrizeRace] = useState(null);
  const [trackPreviewRace, setTrackPreviewRace] = useState(null);
  const [failTargetRace, setFailTargetRace] = useState(null);
  const [failReason, setFailReason] = useState('');
  const [failReasonError, setFailReasonError] = useState('');
  // Launches recorded in this session are used only for the success note.
  // Live controls follow race.status === 'IN_PROGRESS' so a race that moved
  // to PENDING_REVIEW after Unity result submission no longer appears live.
  const [launchedRaceIds, setLaunchedRaceIds] = useState(() => new Set());
  const [readyingRaceId, setReadyingRaceId] = useState(null);
  const [runningRaceId, setRunningRaceId] = useState(null);
  const [failingRaceId, setFailingRaceId] = useState(null);
  const [runErrors, setRunErrors] = useState({});
  const [liveRaceId, setLiveRaceId] = useState(null);
  // FLOW: Admin RaceEntry Assignment Queue Load
  // ORDER: 1/7 - Expanded Tournament/Race panel initializes the hook that loads assignable Registration candidates.
  // FE path: expanded Tournament -> selected Race -> hook loads APPROVED + PAID Registration candidates for assignment.
  // Purpose: keep the assignable Registration queue synchronized with approve/reject and assign/cancel actions.
  const assignment = useRaceEntryAssignment(
    tournament.id,
    selectedRaceId,
    onRaceEntryCountChange,
    queueRefreshKey,
    {
      queueLoadError: t('eventRaceEntryQueueUnavailable'),
      entriesLoadError: t('eventRaceEntryAssignError')
    }
  );

  function selectRace(raceId) {
    setSelectedRaceId((current) => current === raceId ? null : raceId);
  }

  function openAssignment(race) {
    setSelectedRaceId(race.id);
    setAssignmentRace(race);
  }

  async function handleReadyRace(raceId) {
    // FLOW: Admin Mark Race READY
    // ORDER: 2/6 - Handler calls READY API and immediately updates local Race status from backend response.
    // FE path: RaceEntryAssignmentPanel Ready button -> PUT /api/races/{raceId}/ready.
    // Purpose: move a Race from setup state to READY after start time and minimum assigned entries are satisfied.
    setReadyingRaceId(raceId);
    setRunErrors((current) => ({ ...current, [raceId]: '' }));
    try {
      const response = await readyRace(raceId);
      onRaceStatusChange?.(raceId, response?.status || 'READY');
      setSelectedRaceId(raceId);
    } catch (error) {
      setRunErrors((current) => ({ ...current, [raceId]: error.message || t('eventRaceReadyError') }));
    } finally {
      setReadyingRaceId(null);
    }
  }

  async function handleRunRace(raceId) {
    // FLOW: Admin Launch Unity Race
    // ORDER: 2/9 - Handler asks backend to launch Unity, then opens live view only after backend returns IN_PROGRESS.
    // FE path: READY Race row -> Run Race button -> POST /api/races/{raceId}/run.
    // Purpose: ask backend to launch Unity; UI switches to live view only after backend returns IN_PROGRESS.
    setRunningRaceId(raceId);
    setRunErrors((current) => ({ ...current, [raceId]: '' }));
    try {
      const response = await runRace(raceId);
      setLaunchedRaceIds((current) => new Set(current).add(raceId));
      onRaceStatusChange?.(raceId, response?.status || 'IN_PROGRESS');
      setLiveRaceId(raceId);
      // Auto-expand the row so RaceLiveView (rendered inside the expanded
      // section below) is visible immediately, no extra click needed.
      setSelectedRaceId(raceId);
    } catch (error) {
      setRunErrors((current) => ({ ...current, [raceId]: error.message || t('eventRaceLaunchError') }));
    } finally {
      setRunningRaceId(null);
    }
  }

  async function submitFailRace(event) {
    // FLOW: Admin Fail Running Race
    // ORDER: 3/7 - Submit handler trims/validates the reason, calls backend fail API, then clears live UI state after success.
    // FE path: IN_PROGRESS Race -> fail dialog -> PUT /api/races/{raceId}/run/fail.
    // Purpose: stop showing live data locally only after backend cancels the failed run.
    event.preventDefault();
    if (!failTargetRace) return;

    const trimmedReason = failReason.trim();
    if (!trimmedReason) {
      setFailReasonError(t('eventRaceFailRequired'));
      return;
    }

    setFailingRaceId(failTargetRace.id);
    setRunErrors((current) => ({ ...current, [failTargetRace.id]: '' }));
    setFailReasonError('');

    try {
      const response = await failRaceRun(failTargetRace.id, trimmedReason);
      setLaunchedRaceIds((current) => {
        const next = new Set(current);
        next.delete(failTargetRace.id);
        return next;
      });
      setLiveRaceId((current) => current === failTargetRace.id ? null : current);
      onRaceStatusChange?.(failTargetRace.id, response?.status || 'CANCELLED');
      setFailTargetRace(null);
      setFailReason('');
    } catch (error) {
      setFailReasonError(error.message || t('eventRaceFailError'));
    } finally {
      setFailingRaceId(null);
    }
  }

  function openFailDialog(race) {
    // FLOW: Admin Fail Running Race
    // ORDER: 2/7 - Opening the dialog stores the target Race and resets stale failure reason/error state.
    setFailTargetRace(race);
    setFailReason('');
    setFailReasonError('');
  }

  function closeFailDialog() {
    if (failingRaceId) return;
    setFailTargetRace(null);
    setFailReason('');
    setFailReasonError('');
  }

  function toggleLiveView(raceId) {
    setLiveRaceId((current) => current === raceId ? null : raceId);
    setSelectedRaceId(raceId);
  }

  function handleLiveResult(raceId, status) {
    onRaceStatusChange?.(raceId, status);
    if (status && status !== 'IN_PROGRESS') {
      setLiveRaceId((current) => current === raceId ? null : current);
      setLaunchedRaceIds((current) => {
        const next = new Set(current);
        next.delete(raceId);
        return next;
      });
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/80 shadow-[0_12px_34px_rgba(78,44,25,0.08)]">
      <header className="flex flex-col gap-3 border-b border-brown-700/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(247,234,216,0.52))] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-black uppercase text-brown-500">{t('eventRaceEntryTitle')}</p><h4 className="mt-1 text-lg font-black text-brown-900">{t('eventWorkspaceRaceProgramme')}</h4><p className="mt-0.5 text-xs font-semibold text-slate-500">{t('eventRaceEntrySubtitle')}</p></div>
        <span className="shrink-0 rounded-full bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700">{tournament.races.length} Race</span>
      </header>

      <div className="divide-y divide-brown-700/10">
        {tournament.races.map((race, index) => {
          const selected = selectedRaceId === race.id;
          const selectedEntriesReady = selected && assignment.entriesRaceId === race.id && !assignment.entriesLoading && !assignment.entriesError;
          const runnerCount = selectedEntriesReady
            ? assignment.entries.length
            : Number(race.entries || 0);
          const isFull = runnerCount >= race.maxRunners;
          const isLive = race.status === 'IN_PROGRESS';
          const isPendingReview = race.status === 'PENDING_REVIEW';
          const canManageRaceEntries = RACE_ENTRY_EDITABLE_STATUSES.has(race.status);
          const raceEntryLockReason = canManageRaceEntries ? '' : getRaceEntryLockReason(race.status, t);
          const hasMinimumLaunchEntries = runnerCount >= MIN_RACE_ENTRIES_TO_LAUNCH;
          const raceStartReached = race.raceStartTime ? new Date(race.raceStartTime).getTime() <= Date.now() : false;
          const runError = runErrors[race.id];

          return (
            <Fragment key={race.id}>
              <motion.div layout className={`grid gap-3 px-4 py-3.5 transition-colors lg:grid-cols-[2.25rem_minmax(0,1fr)_minmax(19rem,auto)] lg:items-center ${selected ? 'bg-white/80 shadow-[inset_3px_0_0_#d9a441]' : 'hover:bg-white/55'}`}>
                <button type="button" onClick={() => selectRace(race.id)} className={`grid size-9 place-items-center rounded-lg ${selected ? 'bg-brown-700 text-white' : 'bg-cream-200 text-brown-700'}`} aria-label={selected ? t('eventCommonClose') : t('eventCommonViewDetail')}>{selected ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
                <div className="flex min-w-0 gap-3">
                  <button
                    type="button"
                    onClick={() => race.trackImageSrc && setTrackPreviewRace(race)}
                    disabled={!race.trackImageSrc}
                    className="hidden size-16 shrink-0 overflow-hidden rounded-lg border border-brown-700/10 bg-cream-200 text-brown-500 transition hover:border-brown-500 disabled:cursor-default sm:grid sm:place-items-center"
                    aria-label={race.trackImageSrc ? `${t('eventWizardRaceTrackImagePreviewAlt')}: ${race.track}` : t('eventWizardRaceTrackImagePreviewAlt')}
                  >
                    {race.trackImageSrc ? (
                      <img src={race.trackImageSrc} alt={race.track} className="h-full w-full cursor-zoom-in object-cover" />
                    ) : (
                      <ImageIcon size={18} />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => selectRace(race.id)} className="min-w-0 text-left">
                    <p className="text-xs font-black uppercase text-brown-500">Race {String(index + 1).padStart(2, '0')}</p>
                    <h5 className="mt-1 truncate font-black text-brown-900">{race.name}</h5>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{race.track} · {formatRaceSchedule(race)} · {race.distance}m</p>
                  </button>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
                    <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-brown-700/10 bg-white px-3 text-xs font-extrabold text-slate-600">
                      {t('eventRaceEntryParticipants', { count: runnerCount, max: race.maxRunners })}
                    </span>
                    <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-brown-700/10 bg-white px-3 text-xs font-extrabold text-slate-600">
                      {t('eventWorkspacePrizeRanks')} <strong className="text-brown-900">{race.prizes.length}</strong>
                    </span>
                    <TournamentStatusBadge status={race.status} />
                  </div>
                  {runError && <p className="mt-2 text-xs font-bold text-danger">{runError}</p>}
                  {!runError && race.runStuck && <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">{t('eventRaceStuckWarning', { elapsed: race.runElapsedMinutes, timeout: race.runWatchdogTimeoutMinutes })}</p>}
                  {!runError && launchedRaceIds.has(race.id) && isLive && <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><p>{t('eventRaceLiveLaunched')}</p></div>}
                  {isPendingReview && (
                    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 sm:flex-row sm:items-center sm:justify-between">
                      <p>{t('eventRacePendingReviewNotice')}</p>
                      {onNavigateToResultReview && (
                        <button
                          type="button"
                          onClick={onNavigateToResultReview}
                          className="inline-flex min-h-8 items-center justify-center rounded-md border border-violet-200 bg-white px-3 font-extrabold text-violet-800 hover:bg-violet-100"
                        >
                          {t('eventWorkspacePendingReviewAction')}
                        </button>
                      )}
                    </div>
                  )}
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:justify-self-end">
                  {(canManageRaceEntries || race.status === 'READY' || isLive) && (
                    isLive ? (
                      <>
                        <button type="button" onClick={() => toggleLiveView(race.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100">
                          <Radio size={15} />{liveRaceId === race.id ? t('eventRaceLiveHide') : t('eventRaceLiveShow')}
                        </button>
                        {/* FLOW: Admin Fail Running Race */}
                        {/* ORDER: 1/7 - Fail button appears only while Race is live/IN_PROGRESS and starts the recovery dialog. */}
                        <button type="button" disabled={failingRaceId === race.id} onClick={() => openFailDialog(race)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                          {failingRaceId === race.id ? <LoaderCircle size={15} className="animate-spin" /> : <XCircle size={15} />}
                          {failingRaceId === race.id ? t('eventCommonProcessing') : t('eventRaceFailTitle')}
                        </button>
                      </>
                    ) : race.status === 'READY' ? (
                      <button type="button" disabled={runningRaceId === race.id || !hasMinimumLaunchEntries} onClick={() => handleRunRace(race.id)} title={!hasMinimumLaunchEntries ? t('eventRaceLaunchMinimum', { count: MIN_RACE_ENTRIES_TO_LAUNCH }) : undefined} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 text-xs font-extrabold text-brown-700 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60">
                        {/* FLOW: Admin Launch Unity Race */}
                        {/* ORDER: 1/9 - Run Race button appears only for READY Race rows and submits launch request. */}
                        {runningRaceId === race.id ? <LoaderCircle size={15} className="animate-spin" /> : <PlayCircle size={15} />}
                        {runningRaceId === race.id ? t('eventRaceLaunching') : t('eventRaceLaunchTitle')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={readyingRaceId === race.id || !hasMinimumLaunchEntries || !raceStartReached}
                        onClick={() => handleReadyRace(race.id)}
                        title={!raceStartReached ? t('eventRaceReadyTimeRequired') : !hasMinimumLaunchEntries ? t('eventRaceReadyMinimum', { count: MIN_RACE_ENTRIES_TO_LAUNCH }) : undefined}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-extrabold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {/* FLOW: Admin Mark Race READY */}
                        {/* ORDER: 1/6 - Ready button is enabled only after start time and minimum assigned RaceEntries are satisfied. */}
                        {readyingRaceId === race.id ? <LoaderCircle size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                        {readyingRaceId === race.id ? t('eventCommonProcessing') : t('eventRaceReadyTitle')}
                      </button>
                    )
                  )}
                  <button type="button" onClick={() => setPrizeRuleRace(race)} className="inline-flex min-h-10 min-w-[7rem] items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-extrabold text-amber-800 shadow-sm hover:bg-amber-100"><Trophy size={15} />{t('eventWorkspacePrizeRule')}</button>
                  {race.status === 'COMPLETED' && (
                    /* FLOW: Official Result Display */
                    /* ORDER: 1/7 - Admin opens the official result/prize dialog only after Race is COMPLETED. */
                    <button type="button" onClick={() => setResultPrizeRace(race)} className="inline-flex min-h-10 min-w-[7rem] items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-800 shadow-sm hover:bg-emerald-100"><Medal size={15} />{t('eventWorkspaceOfficialResult')}</button>
                  )}
                  <button type="button" disabled={!canManageRaceEntries || isFull || assignment.queueLoading} onClick={() => openAssignment(race)} title={!canManageRaceEntries ? raceEntryLockReason : undefined} className={`inline-flex min-h-10 min-w-[12.25rem] items-center justify-center gap-2 rounded-lg border px-3 text-xs font-extrabold shadow-sm ${isFull ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700' : !canManageRaceEntries ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-800' : 'border-brown-700/15 bg-white text-brown-700 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60'}`}><UserPlus size={15} />{isFull ? t('eventRaceEntryFull') : canManageRaceEntries ? t('eventRaceEntryTitle') : t('eventRaceEntryLocked')}</button>
                  {canManageRaceEntries && (!raceStartReached || !hasMinimumLaunchEntries) && (
                    <p className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-900">
                      {/* FLOW: Admin Mark Race READY */}
                      {/* ORDER: 1A/6 - UI explains which READY prerequisite is missing before Admin can submit. */}
                      {!raceStartReached ? t('eventRaceReadyTimeRequired') : t('eventRaceReadyMinimum', { count: MIN_RACE_ENTRIES_TO_LAUNCH })}
                    </p>
                  )}
                  {race.status === 'READY' && !hasMinimumLaunchEntries && (
                    <p className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-900">
                      {/* FLOW: Admin Launch Unity Race */}
                      {/* ORDER: 1A/9 - UI blocks launch until the Race has enough active ASSIGNED RaceEntries. */}
                      {t('eventRaceLaunchMinimum', { count: MIN_RACE_ENTRIES_TO_LAUNCH })}
                    </p>
                  )}
                  {!canManageRaceEntries && (
                    <p className="sm:col-span-2 rounded-lg border border-brown-700/10 bg-cream-200/55 px-3 py-2 text-xs font-extrabold text-slate-600">
                      {raceEntryLockReason}
                    </p>
                  )}
                </div>
              </motion.div>

              <AnimatePresence initial={false}>
                {selected && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} className="overflow-hidden bg-cream-200/30">
                    <div className="px-4 py-3.5">
                      <RaceLiveView
                        raceId={race.id}
                        active={liveRaceId === race.id}
                        onResult={(status) => handleLiveResult(race.id, status)}
                      />
                      {assignment.entriesLoading ? (
                        <div className="grid min-h-36 place-items-center rounded-lg border border-brown-700/10 bg-white/75 text-center"><div><LoaderCircle className="mx-auto animate-spin text-brown-500" size={23} /><p className="mt-3 text-sm font-black text-brown-900">{t('eventCommonLoading')}</p></div></div>
                      ) : assignment.entriesError ? (
                        <div className="grid min-h-36 place-items-center rounded-lg border border-red-200 bg-red-50 p-5 text-center"><div><AlertTriangle className="mx-auto text-danger" size={22} /><p className="mt-3 text-sm font-black text-brown-900">{t('eventCommonLoadError')}</p><p className="mt-1 text-xs font-semibold text-slate-500">{assignment.entriesError}</p><button type="button" onClick={assignment.retryEntries} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-brown-700 px-3 text-xs font-extrabold text-white"><RefreshCw size={13} /> {t('eventCommonRetry')}</button></div></div>
                      ) : (
                        <>
                          {/* FLOW: Admin Assigned RaceEntry Load */}
                          {/* ORDER: 1/6 - Selected Race panel renders the loaded official ASSIGNED entries. */}
                          <OfficialEntries race={race} entries={assignment.entries} onCancel={setCancellationEntry} canCancel={canManageRaceEntries} cancelDisabledReason={raceEntryLockReason} />
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Fragment>
          );
        })}

        {tournament.races.length === 0 && <div className="grid min-h-44 place-items-center p-6 text-center"><div><Flag className="mx-auto text-brown-500" size={24} /><p className="mt-3 font-black text-brown-900">{t('eventRaceNoConfiguredTitle')}</p><p className="mt-1 text-sm font-semibold text-slate-500">{t('eventRaceNoConfiguredHint')}</p></div></div>}
      </div>

      <AnimatePresence>
        {assignmentRace && (
          <>
          {/* FLOW: Admin Assign RaceEntry */}
          {/* ORDER: 1/8 - Panel opens AssignmentDialog for the selected Race and passes the hook assign action. */}
          <AssignmentDialog
            tournament={tournament}
            race={assignmentRace}
            candidates={assignment.candidates}
            entries={assignment.entries}
            entriesLoading={assignment.entriesLoading}
            entriesError={assignment.entriesError}
            entriesReady={assignment.entriesRaceId === assignmentRace.id}
            queueLoading={assignment.queueLoading}
            queueError={assignment.queueError}
            onRetryEntries={assignment.retryEntries}
            onRetryQueue={assignment.retryQueue}
            onClose={() => setAssignmentRace(null)}
            onAssign={assignment.assignRegistration}
          />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {prizeRuleRace && (
          <PrizeRuleDialog
            race={prizeRuleRace}
            onClose={() => setPrizeRuleRace(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {resultPrizeRace && (
          /* FLOW: Official Result Display */
          /* ORDER: 1A/7 - Dialog receives selected Race context and becomes responsible for loading official rows. */
          <RaceResultPrizeDialog
            race={resultPrizeRace}
            onClose={() => setResultPrizeRace(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {cancellationEntry && (
          <CancellationDialog
            entry={cancellationEntry}
            onClose={() => setCancellationEntry(null)}
            onConfirm={assignment.cancelEntry}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {trackPreviewRace && (
          <ImagePreviewDialog
            src={trackPreviewRace.trackImageSrc}
            alt={trackPreviewRace.track}
            title={trackPreviewRace.name}
            onClose={() => setTrackPreviewRace(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {failTargetRace && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] grid place-items-center bg-brown-900/65 p-4 backdrop-blur-sm"
            onMouseDown={closeFailDialog}
          >
            <motion.form
              initial={{ y: 18, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onSubmit={submitFailRace}
              onMouseDown={(event) => event.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-lg border border-white/60 bg-cream-100 shadow-[0_32px_90px_rgba(43,23,16,0.46)]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="fail-race-title"
            >
              <header className="flex items-start justify-between gap-4 border-b border-brown-700/10 bg-white/75 p-5">
                <div>
                  <p className="text-xs font-black uppercase text-red-700">{t('eventRaceFailTitle')}</p>
                  <h3 id="fail-race-title" className="mt-1 text-xl font-black text-brown-900">{failTargetRace.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{failTargetRace.track} · {formatRaceSchedule(failTargetRace)}</p>
                </div>
                <button type="button" disabled={Boolean(failingRaceId)} onClick={closeFailDialog} className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200 disabled:opacity-50" aria-label={t('eventCommonClose')}>
                  <XCircle size={17} />
                </button>
              </header>

              <div className="p-5">
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
                  <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                  <p>{t('eventRaceFailBackendHint')}</p>
                </div>
                <label className="mt-4 grid gap-1.5 text-sm font-extrabold text-brown-900">
                  {t('eventRaceFailReason')}
                  <textarea
                    autoFocus
                    value={failReason}
                    onChange={(event) => {
                      setFailReason(event.target.value);
                      setFailReasonError('');
                    }}
                    maxLength={500}
                    className="min-h-28 resize-y rounded-lg border border-brown-700/15 bg-white px-3.5 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15"
                    placeholder={t('eventRaceFailPlaceholder')}
                  />
                </label>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <span className="text-xs font-bold text-danger">{failReasonError}</span>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">{failReason.length}/500</span>
                </div>
              </div>

              <footer className="flex justify-end gap-2 border-t border-brown-700/10 bg-white/70 p-4">
                <button type="button" disabled={Boolean(failingRaceId)} onClick={closeFailDialog} className="min-h-10 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">{t('eventRaceKeep')}</button>
                <button type="submit" disabled={Boolean(failingRaceId)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-extrabold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {failingRaceId ? <LoaderCircle className="animate-spin" size={16} /> : <XCircle size={16} />}
                  {t('eventRaceFailTitle')}
                </button>
              </footer>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
