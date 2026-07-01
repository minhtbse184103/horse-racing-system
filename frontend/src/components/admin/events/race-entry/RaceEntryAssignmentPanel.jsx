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

export default function RaceEntryAssignmentPanel({ tournament, onRaceEntryCountChange, onRaceStatusChange, queueRefreshKey }) {
  const [selectedRaceId, setSelectedRaceId] = useState(tournament.races[0]?.id || null);
  const [assignmentRace, setAssignmentRace] = useState(null);
  const [cancellationEntry, setCancellationEntry] = useState(null);
  const [prizeRuleRace, setPrizeRuleRace] = useState(null);
  const [resultPrizeRace, setResultPrizeRace] = useState(null);
  // Launches recorded in this session so the button flips to "Xem trực
  // tiếp" immediately, without waiting on the parent to refetch the
  // tournament workspace. race.runStartedAt (from the backend) is the
  // durable source of truth and still wins on the next refetch/reload.
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
      await runRace(raceId);
      setLaunchedRaceIds((current) => new Set(current).add(raceId));
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

  async function handleFailRace(race) {
    const reason = window.prompt('Nhập lý do đánh dấu Race lỗi / hủy Race đang chạy:');

    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setRunErrors((current) => ({ ...current, [race.id]: 'Vui lòng nhập lý do trước khi đánh dấu Race lỗi.' }));
      return;
    }

    setFailingRaceId(race.id);
    setRunErrors((current) => ({ ...current, [race.id]: '' }));

    try {
      const response = await failRaceRun(race.id, trimmedReason);
      setLaunchedRaceIds((current) => {
        const next = new Set(current);
        next.delete(race.id);
        return next;
      });
      setLiveRaceId((current) => current === race.id ? null : current);
      onRaceStatusChange?.(race.id, response?.status || 'CANCELLED');
    } catch (error) {
      setRunErrors((current) => ({ ...current, [race.id]: error.message || 'Không thể đánh dấu Race lỗi.' }));
    } finally {
      setFailingRaceId(null);
    }
  }

  function toggleLiveView(raceId) {
    setLiveRaceId((current) => current === raceId ? null : raceId);
    setSelectedRaceId(raceId);
  }

  return (
    <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-white/75 shadow-[0_10px_30px_rgba(78,44,25,0.07)]">
      <header className="flex flex-col gap-3 border-b border-brown-700/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-black uppercase text-brown-500">Phân công RaceEntry</p><h4 className="mt-1 text-lg font-black text-brown-900">Chương trình Race và RaceEntry chính thức</h4><p className="mt-0.5 text-xs font-semibold text-slate-500">Chọn Race, kiểm tra sức chứa, sau đó phân công Registration đã APPROVED và PAID.</p></div>
        <span className="shrink-0 rounded-full bg-cream-200 px-3 py-1.5 text-xs font-extrabold text-brown-700">{tournament.races.length} Race</span>
      </header>

      <div className="divide-y divide-brown-700/10">
        {tournament.races.map((race, index) => {
          const selected = selectedRaceId === race.id;
          const runnerCount = selected && !assignment.entriesLoading && !assignment.entriesError
            ? assignment.entries.length
            : Number(race.entries || 0);
          const isFull = runnerCount >= race.maxRunners;
          const isLive = race.status === 'IN_PROGRESS' || Boolean(race.runStartedAt) || launchedRaceIds.has(race.id);
          const runError = runErrors[race.id];

          return (
            <Fragment key={race.id}>
              <motion.div layout className={`grid gap-3 px-4 py-3.5 transition-colors lg:grid-cols-[2.25rem_minmax(0,1fr)_auto] lg:items-center ${selected ? 'bg-white/70 shadow-[inset_3px_0_0_#d9a441]' : 'hover:bg-white/45'}`}>
                <button type="button" onClick={() => selectRace(race.id)} className={`grid size-9 place-items-center rounded-lg ${selected ? 'bg-brown-700 text-white' : 'bg-cream-200 text-brown-700'}`} aria-label={selected ? 'Thu gọn Race' : 'Mở rộng Race'}>{selected ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button>
                <div className="min-w-0">
                  <button type="button" onClick={() => selectRace(race.id)} className="min-w-0 text-left">
                    <p className="text-xs font-black uppercase text-brown-500">Race {String(index + 1).padStart(2, '0')}</p>
                    <h5 className="mt-1 truncate font-black text-brown-900">{race.name}</h5>
                    <p className="mt-1 truncate text-xs font-semibold text-slate-500">{race.track} · {formatRaceSchedule(race)} · {race.distance}m</p>
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
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
                  {!runError && launchedRaceIds.has(race.id) && <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><p>Race đã được khởi chạy bằng Unity Engine. Theo dõi dữ liệu live từ backend tại đây.</p></div>}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-[26rem]">
                  {(race.status === 'READY' || isLive) && (
                    isLive ? (
                      <>
                        <button type="button" onClick={() => toggleLiveView(race.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100">
                          <Radio size={15} />{liveRaceId === race.id ? 'Ẩn trực tiếp' : 'Xem trực tiếp'}
                        </button>
                        <button type="button" disabled={failingRaceId === race.id} onClick={() => handleFailRace(race)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-extrabold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                          {failingRaceId === race.id ? <LoaderCircle size={15} className="animate-spin" /> : <XCircle size={15} />}
                          {failingRaceId === race.id ? 'Đang xử lý' : 'Đánh dấu lỗi'}
                        </button>
                      </>
                    ) : (
                      <button type="button" disabled={runningRaceId === race.id} onClick={() => handleRunRace(race.id)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-3 text-xs font-extrabold text-brown-700 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60">
                        {runningRaceId === race.id ? <LoaderCircle size={15} className="animate-spin" /> : <PlayCircle size={15} />}
                        {runningRaceId === race.id ? 'Đang khởi chạy' : 'Khởi chạy Race'}
                      </button>
                    )
                  )}
                  <button type="button" onClick={() => setPrizeRuleRace(race)} className="inline-flex min-h-10 min-w-[7rem] items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-extrabold text-amber-800 hover:bg-amber-100"><Trophy size={15} />Prize rule</button>
                  {race.status === 'COMPLETED' && (
                    <button type="button" onClick={() => setResultPrizeRace(race)} className="inline-flex min-h-10 min-w-[7rem] items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100"><Medal size={15} />Kết quả</button>
                  )}
                  <button type="button" disabled={isFull || assignment.queueLoading} onClick={() => openAssignment(race)} className={`inline-flex min-h-10 min-w-[12.25rem] items-center justify-center gap-2 rounded-lg border px-3 text-xs font-extrabold ${isFull ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-700' : 'border-brown-700/15 bg-white text-brown-700 hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-60'}`}><UserPlus size={15} />{isFull ? 'Race đã đầy' : 'Phân công RaceEntry'}</button>
                </div>
              </motion.div>

              <AnimatePresence initial={false}>
                {selected && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} className="overflow-hidden bg-cream-200/30">
                    <div className="px-4 py-3.5">
                      <RaceLiveView
                        raceId={race.id}
                        active={liveRaceId === race.id}
                        onResult={(status) => onRaceStatusChange?.(race.id, status)}
                      />
                      {assignment.entriesLoading ? (
                        <div className="grid min-h-36 place-items-center rounded-lg border border-brown-700/10 bg-white/75 text-center"><div><LoaderCircle className="mx-auto animate-spin text-brown-500" size={23} /><p className="mt-3 text-sm font-black text-brown-900">Đang tải RaceEntry chính thức</p></div></div>
                      ) : assignment.entriesError ? (
                        <div className="grid min-h-36 place-items-center rounded-lg border border-red-200 bg-red-50 p-5 text-center"><div><AlertTriangle className="mx-auto text-danger" size={22} /><p className="mt-3 text-sm font-black text-brown-900">Không thể tải RaceEntry</p><p className="mt-1 text-xs font-semibold text-slate-500">{assignment.entriesError}</p><button type="button" onClick={assignment.retryEntries} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-brown-700 px-3 text-xs font-extrabold text-white"><RefreshCw size={13} /> Thử lại</button></div></div>
                      ) : <OfficialEntries race={race} entries={assignment.entries} onCancel={setCancellationEntry} />}
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
            queueLoading={assignment.queueLoading}
            queueError={assignment.queueError}
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
    </section>
  );
}
