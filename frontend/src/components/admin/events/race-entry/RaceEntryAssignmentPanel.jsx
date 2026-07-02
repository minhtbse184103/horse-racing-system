import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronRight, Flag, LoaderCircle, Medal, PlayCircle, Radio, RefreshCw, Trophy, UserPlus, XCircle } from 'lucide-react';
import AssignmentDialog from './AssignmentDialog';
import CancellationDialog from './CancellationDialog';
import OfficialEntries from './OfficialEntries';
import PrizeRuleDialog from './PrizeRuleDialog';
import RaceResultPrizeDialog from './RaceResultPrizeDialog';
import RaceLiveView from './RaceLiveView';
import useRaceEntryAssignment from './useRaceEntryAssignment';
import TournamentStatusBadge from '../TournamentStatusBadge';
import { failRaceRun, runRace } from '../../../../services/eventService';
import { formatRaceSchedule } from '../../../../lib/eventFormatters';

const RACE_ENTRY_EDITABLE_STATUSES = new Set(['OPEN_FOR_REGISTRATION', 'REGISTRATION_CLOSED']);
const MIN_RACE_ENTRIES_TO_LAUNCH = 3;

function getRaceEntryLockReason(status) {
  const messages = {
    READY: 'Race đã READY, không thể thay đổi RaceEntry trước khi khởi chạy.',
    IN_PROGRESS: 'Race đang chạy, không thể thay đổi RaceEntry.',
    PENDING_REVIEW: 'Race đang chờ duyệt kết quả, không thể thay đổi RaceEntry.',
    COMPLETED: 'Race đã hoàn tất, không thể thay đổi RaceEntry.',
    CANCELLED: 'Race đã hủy, không thể thay đổi RaceEntry.'
  };

  return messages[status] || 'Race hiện không cho phép thay đổi RaceEntry.';
}

export default function RaceEntryAssignmentPanel({ tournament, onRaceEntryCountChange, onRaceStatusChange, onNavigateToResultReview, queueRefreshKey }) {
  const [selectedRaceId, setSelectedRaceId] = useState(tournament.races[0]?.id || null);
  const [assignmentRace, setAssignmentRace] = useState(null);
  const [cancellationEntry, setCancellationEntry] = useState(null);
  const [prizeRuleRace, setPrizeRuleRace] = useState(null);
  const [resultPrizeRace, setResultPrizeRace] = useState(null);
  const [failTargetRace, setFailTargetRace] = useState(null);
  const [failReason, setFailReason] = useState('');
  const [failReasonError, setFailReasonError] = useState('');
  // Launches recorded in this session are used only for the success note.
  // Live controls follow race.status === 'IN_PROGRESS' so a race that moved
  // to PENDING_REVIEW after Unity result submission no longer appears live.
  const [launchedRaceIds, setLaunchedRaceIds] = useState(() => new Set());
  const [runningRaceId, setRunningRaceId] = useState(null);
  const [failingRaceId, setFailingRaceId] = useState(null);
  const [runErrors, setRunErrors] = useState({});
  const [liveRaceId, setLiveRaceId] = useState(null);
  const assignment = useRaceEntryAssignment(
    tournament.id,
    selectedRaceId,
    onRaceEntryCountChange,
    queueRefreshKey
  );

  function selectRace(raceId) {
    setSelectedRaceId((current) => current === raceId ? null : raceId);
  }

  function openAssignment(race) {
    setSelectedRaceId(race.id);
    setAssignmentRace(race);
  }

  async function handleRunRace(raceId) {
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
      setRunErrors((current) => ({ ...current, [raceId]: error.message || 'Không thể khởi chạy Race.' }));
    } finally {
      setRunningRaceId(null);
    }
  }

  async function submitFailRace(event) {
    event.preventDefault();
    if (!failTargetRace) return;

    const trimmedReason = failReason.trim();
    if (!trimmedReason) {
      setFailReasonError('Vui lòng nhập lý do trước khi đánh dấu Race lỗi.');
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
      setFailReasonError(error.message || 'Không thể đánh dấu Race lỗi.');
    } finally {
      setFailingRaceId(null);
    }
  }

  function openFailDialog(race) {
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
        <div><p className="text-xs font-black uppercase text-brown-500">Phân công RaceEntry</p><h4 className="mt-1 text-lg font-black text-brown-900">Chương trình Race và RaceEntry chính thức</h4><p className="mt-0.5 text-xs font-semibold text-slate-500">Chọn Race, kiểm tra sức chứa, sau đó phân công Registration đã APPROVED và PAID.</p></div>
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
          const raceEntryLockReason = canManageRaceEntries ? '' : getRaceEntryLockReason(race.status);
          const hasMinimumLaunchEntries = runnerCount >= MIN_RACE_ENTRIES_TO_LAUNCH;
          const runError = runErrors[race.id];

          return (
            <Fragment key={race.id}>
              <motion.div layout className={`grid gap-3 px-4 py-3.5 transition-colors lg:grid-cols-[2.25rem_minmax(0,1fr)_minmax(19rem,auto)] lg:items-center ${selected ? 'bg-white/80 shadow-[inset_3px_0_0_#d9a441]' : 'hover:bg-white/55'}`}>
                <button type="button" onClick={() => selectRace(race.id)} className={`grid size-9 place-items-center rounded-lg ${selected ? 'bg-brown-700 text-white' : 'bg-cream-200 text-brown-700'}`} aria-label={selected ? 'Thu gọn Race' : 'Mở rộng Race'}>{selected ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
                <div className="min-w-0">
                  <button type="button" onClick={() => selectRace(race.id)} className="min-w-0 text-left">
                    <p className="text-xs font-black uppercase text-brown-500">Race {String(index + 1).padStart(2, '0')}</p>
                    <h5 className="mt-1 truncate font-black text-brown-900">{race.name}</h5>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{race.track} · {formatRaceSchedule(race)} · {race.distance}m</p>
                  </button>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
                    <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-brown-700/10 bg-white px-3 text-xs font-extrabold text-slate-600">
                      Người tham gia <strong className="text-brown-900">{runnerCount}/{race.maxRunners}</strong>
                    </span>
                    <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-brown-700/10 bg-white px-3 text-xs font-extrabold text-slate-600">
                      Hạng giải thưởng <strong className="text-brown-900">{race.prizes.length}</strong>
                    </span>
                    <TournamentStatusBadge status={race.status} />
                  </div>
                  {runError && <p className="mt-2 text-xs font-bold text-danger">{runError}</p>}
                  {!runError && race.runStuck && <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700">Race có thể bị kẹt: đã chạy {race.runElapsedMinutes} phút, vượt ngưỡng {race.runWatchdogTimeoutMinutes} phút nhưng chưa có kết quả. Hãy kiểm tra Unity hoặc dùng Đánh dấu lỗi.</p>}
                  {!runError && launchedRaceIds.has(race.id) && isLive && <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><p>Race đã được khởi chạy bằng Unity Engine. Theo dõi dữ liệu live từ backend tại đây.</p></div>}
                  {isPendingReview && (
                    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 sm:flex-row sm:items-center sm:justify-between">
                      <p>Race đã có kết quả từ Unity và đang chờ Referee/Admin duyệt.</p>
                      {onNavigateToResultReview && (
                        <button
                          type="button"
                          onClick={onNavigateToResultReview}
                          className="inline-flex min-h-8 items-center justify-center rounded-md border border-violet-200 bg-white px-3 font-extrabold text-violet-800 hover:bg-violet-100"
                        >
                          Đi tới duyệt kết quả
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:justify-self-end">
                  {(race.status === 'READY' || isLive) && (
                    isLive ? (
                      <>
                        <button type="button" onClick={() => toggleLiveView(race.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100">
                          <Radio size={15} />{liveRaceId === race.id ? 'Ẩn trực tiếp' : 'Xem trực tiếp'}
                        </button>
                        <button type="button" disabled={failingRaceId === race.id} onClick={() => openFailDialog(race)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                          {failingRaceId === race.id ? <LoaderCircle size={15} className="animate-spin" /> : <XCircle size={15} />}
                          {failingRaceId === race.id ? 'Đang xử lý' : 'Đánh dấu lỗi'}
                        </button>
                      </>
                    ) : (
                      <button type="button" disabled={runningRaceId === race.id || !hasMinimumLaunchEntries} onClick={() => handleRunRace(race.id)} title={!hasMinimumLaunchEntries ? 'Cần tối thiểu 3 RaceEntry đã phân công để khởi chạy Unity.' : undefined} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 text-xs font-extrabold text-brown-700 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60">
                        {runningRaceId === race.id ? <LoaderCircle size={15} className="animate-spin" /> : <PlayCircle size={15} />}
                        {runningRaceId === race.id ? 'Đang khởi chạy' : 'Khởi chạy Race'}
                      </button>
                    )
                  )}
                  <button type="button" onClick={() => setPrizeRuleRace(race)} className="inline-flex min-h-10 min-w-[7rem] items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-extrabold text-amber-800 shadow-sm hover:bg-amber-100"><Trophy size={15} />Prize rule</button>
                  {race.status === 'COMPLETED' && (
                    <button type="button" onClick={() => setResultPrizeRace(race)} className="inline-flex min-h-10 min-w-[7rem] items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-800 shadow-sm hover:bg-emerald-100"><Medal size={15} />Kết quả</button>
                  )}
                  <button type="button" disabled={!canManageRaceEntries || isFull || assignment.queueLoading} onClick={() => openAssignment(race)} title={!canManageRaceEntries ? raceEntryLockReason : undefined} className={`inline-flex min-h-10 min-w-[12.25rem] items-center justify-center gap-2 rounded-lg border px-3 text-xs font-extrabold shadow-sm ${isFull ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700' : !canManageRaceEntries ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-800' : 'border-brown-700/15 bg-white text-brown-700 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60'}`}><UserPlus size={15} />{isFull ? 'Race đã đầy' : canManageRaceEntries ? 'Phân công RaceEntry' : 'Đã khóa phân công'}</button>
                  {race.status === 'READY' && !hasMinimumLaunchEntries && (
                    <p className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-extrabold text-amber-900">
                      Cần tối thiểu {MIN_RACE_ENTRIES_TO_LAUNCH} RaceEntry đã phân công để khởi chạy Unity.
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
                        <div className="grid min-h-36 place-items-center rounded-lg border border-brown-700/10 bg-white/75 text-center"><div><LoaderCircle className="mx-auto animate-spin text-brown-500" size={23} /><p className="mt-3 text-sm font-black text-brown-900">Đang tải RaceEntry chính thức</p></div></div>
                      ) : assignment.entriesError ? (
                        <div className="grid min-h-36 place-items-center rounded-lg border border-red-200 bg-red-50 p-5 text-center"><div><AlertTriangle className="mx-auto text-danger" size={22} /><p className="mt-3 text-sm font-black text-brown-900">Không thể tải RaceEntry</p><p className="mt-1 text-xs font-semibold text-slate-500">{assignment.entriesError}</p><button type="button" onClick={assignment.retryEntries} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-brown-700 px-3 text-xs font-extrabold text-white"><RefreshCw size={13} /> Thử lại</button></div></div>
                      ) : <OfficialEntries race={race} entries={assignment.entries} onCancel={setCancellationEntry} canCancel={canManageRaceEntries} cancelDisabledReason={raceEntryLockReason} />}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Fragment>
          );
        })}

        {tournament.races.length === 0 && <div className="grid min-h-44 place-items-center p-6 text-center"><div><Flag className="mx-auto text-brown-500" size={24} /><p className="mt-3 font-black text-brown-900">Chưa cấu hình Race</p><p className="mt-1 text-sm font-semibold text-slate-500">Chỉnh sửa Tournament để tạo chương trình Race trước khi phân công RaceEntry.</p></div></div>}
      </div>

      <AnimatePresence>
        {assignmentRace && (
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
                  <p className="text-xs font-black uppercase text-red-700">Đánh dấu Race lỗi</p>
                  <h3 id="fail-race-title" className="mt-1 text-xl font-black text-brown-900">{failTargetRace.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{failTargetRace.track} · {formatRaceSchedule(failTargetRace)}</p>
                </div>
                <button type="button" disabled={Boolean(failingRaceId)} onClick={closeFailDialog} className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/10 bg-white text-brown-700 hover:bg-cream-200 disabled:opacity-50" aria-label="Đóng">
                  <XCircle size={17} />
                </button>
              </header>

              <div className="p-5">
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800">
                  <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                  <p>Race đang chạy sẽ được backend xử lý lỗi và dừng theo business rule hiện tại.</p>
                </div>
                <label className="mt-4 grid gap-1.5 text-sm font-extrabold text-brown-900">
                  Lý do lỗi
                  <textarea
                    autoFocus
                    value={failReason}
                    onChange={(event) => {
                      setFailReason(event.target.value);
                      setFailReasonError('');
                    }}
                    maxLength={500}
                    className="min-h-28 resize-y rounded-lg border border-brown-700/15 bg-white px-3.5 py-3 text-sm font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/15"
                    placeholder="Nhập lý do Race bị lỗi hoặc cần dừng khẩn cấp"
                  />
                </label>
                <div className="mt-1 flex items-start justify-between gap-3">
                  <span className="text-xs font-bold text-danger">{failReasonError}</span>
                  <span className="shrink-0 text-xs font-semibold text-slate-500">{failReason.length}/500</span>
                </div>
              </div>

              <footer className="flex justify-end gap-2 border-t border-brown-700/10 bg-white/70 p-4">
                <button type="button" disabled={Boolean(failingRaceId)} onClick={closeFailDialog} className="min-h-10 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-extrabold text-brown-700 hover:bg-cream-200 disabled:opacity-50">Giữ Race</button>
                <button type="submit" disabled={Boolean(failingRaceId)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-extrabold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {failingRaceId ? <LoaderCircle className="animate-spin" size={16} /> : <XCircle size={16} />}
                  Đánh dấu lỗi
                </button>
              </footer>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
