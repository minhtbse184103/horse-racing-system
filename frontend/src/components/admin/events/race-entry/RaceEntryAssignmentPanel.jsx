import { Fragment, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronRight, Copy, Flag, KeyRound, LoaderCircle, PlayCircle, Radio, RefreshCw, Trophy, UserPlus, XCircle } from 'lucide-react';
import AssignmentDialog from './AssignmentDialog';
import CancellationDialog from './CancellationDialog';
import OfficialEntries from './OfficialEntries';
import PrizeRuleDialog from './PrizeRuleDialog';
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
  // Launches recorded in this session so the button flips to "Xem trực
  // tiếp" immediately, without waiting on the parent to refetch the
  // tournament workspace. race.runStartedAt (from the backend) is the
  // durable source of truth and still wins on the next refetch/reload.
  const [launchedRaceIds, setLaunchedRaceIds] = useState(() => new Set());
  const [runningRaceId, setRunningRaceId] = useState(null);
  const [failingRaceId, setFailingRaceId] = useState(null);
  const [runErrors, setRunErrors] = useState({});
  // Tracks races launched without a spawned Unity process (engine path not
  // configured on the backend), so the admin knows to start Unity manually
  // pointed at that raceId instead of expecting it to appear on its own.
  const [manualLaunchRaceIds, setManualLaunchRaceIds] = useState(() => new Set());
  const [launchTokensByRaceId, setLaunchTokensByRaceId] = useState(() => new Map());
  const [launchTokenNotice, setLaunchTokenNotice] = useState(null);
  const [tokenCopied, setTokenCopied] = useState(false);
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
      setLaunchTokensByRaceId((current) => {
        const next = new Map(current);
        if (response?.raceEngineToken) {
          next.set(raceId, response.raceEngineToken);
          setLaunchTokenNotice({
            raceId,
            token: response.raceEngineToken,
            engineProcessStarted: Boolean(response.engineProcessStarted)
          });
          setTokenCopied(false);
        } else {
          next.delete(raceId);
        }
        return next;
      });
      setManualLaunchRaceIds((current) => {
        const next = new Set(current);
        if (response?.engineProcessStarted) {
          next.delete(raceId);
        } else {
          next.add(raceId);
        }
        return next;
      });
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
      setManualLaunchRaceIds((current) => {
        const next = new Set(current);
        next.delete(race.id);
        return next;
      });
      setLaunchTokensByRaceId((current) => {
        const next = new Map(current);
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

  async function copyLaunchToken() {
    if (!launchTokenNotice?.token) return;

    await navigator.clipboard.writeText(launchTokenNotice.token);
    setTokenCopied(true);
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
          const isLive = Boolean(race.runStartedAt) || launchedRaceIds.has(race.id);
          const runError = runErrors[race.id];
          const isManualLaunch = manualLaunchRaceIds.has(race.id);
          const launchToken = launchTokensByRaceId.get(race.id);

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
                  {!runError && isManualLaunch && <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700"><p>Race đã được đánh dấu khởi chạy — engine Unity chưa được cấu hình, hãy mở Unity thủ công cho Race này.</p>{launchToken && <p className="mt-1 break-all font-mono text-[0.68rem] text-amber-900">Token: {launchToken}</p>}</div>}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:max-w-[26rem]">
                  {race.status === 'IN_PROGRESS' && (
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
        {launchTokenNotice && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-brown-900/45 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="launch-token-title"
          >
            <motion.div
              initial={{ y: 16, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl rounded-lg border border-white/80 bg-cream-100 p-5 shadow-[0_28px_70px_rgba(43,23,16,0.28)]"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800">
                  <KeyRound size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase text-brown-500">Unity launch token</p>
                  <h3 id="launch-token-title" className="mt-1 text-xl font-black text-brown-900">
                    Race đã được khởi chạy
                  </h3>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                    Copy token này vào ô <strong>Token</strong> trong Unity rồi bấm <strong>Load + Start</strong>.
                    Token chỉ hiện ngay sau lần khởi chạy này.
                  </p>

                  <div className="mt-4 rounded-lg border border-brown-700/10 bg-white px-3 py-3">
                    <p className="break-all font-mono text-xs font-black text-brown-900">{launchTokenNotice.token}</p>
                  </div>

                  {launchTokenNotice.engineProcessStarted && (
                    <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-700">
                      Backend đã tự mở Unity process. Bạn chỉ cần dùng token này nếu chạy Unity thủ công.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t border-brown-700/10 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setLaunchTokenNotice(null)}
                  className="min-h-10 rounded-lg border border-brown-700/15 bg-white px-4 text-sm font-extrabold text-brown-700 hover:bg-cream-200"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={copyLaunchToken}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brown-700 px-4 text-sm font-extrabold text-white hover:bg-brown-900"
                >
                  <Copy size={15} /> {tokenCopied ? 'Đã copy' : 'Copy token'}
                </button>
              </div>
            </motion.div>
          </motion.div>
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
