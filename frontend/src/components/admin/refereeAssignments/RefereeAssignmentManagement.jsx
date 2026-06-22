import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCog,
  Users
} from 'lucide-react';
import {
  getRacesByTournament,
  getTournaments
} from '../../../services/eventService';
import {
  createRefereeAssignment,
  getActiveReferees,
  getRefereeAssignments,
  removeRefereeAssignment,
  replaceRefereeAssignment
} from '../../../services/refereeAssignmentService';

function formatDateTime(value) {
  if (!value) return 'Chưa lên lịch';

  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(value) {
  if (!value) return 'Chưa lên lịch';

  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatStatus(status) {
  return normalizeStatus(status);
}

function refereeId(referee) {
  return referee.id ?? referee.Id;
}

const ASSIGNABLE_RACE_STATUSES = new Set([
  'OPEN_FOR_REGISTRATION',
  'REGISTRATION_CLOSED'
]);

function normalizeStatus(status) {
  return String(status || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toUpperCase();
}

function AssignmentModal({
  action,
  races,
  referees,
  isProcessing,
  error,
  onClose,
  onConfirm
}) {
  const [raceId, setRaceId] = useState(action?.assignment?.raceId || '');
  const [selectedRefereeId, setSelectedRefereeId] = useState('');

  useEffect(() => {
    setRaceId(action?.assignment?.raceId || '');
    setSelectedRefereeId('');
  }, [action]);

  if (!action) return null;

  const replacing = action.type === 'replace';

  const availableReferees = replacing
    ? referees.filter(
        (referee) =>
          String(refereeId(referee)) !==
          String(action.assignment.refereeUserId)
      )
    : referees;

  const selectedRace = races.find(
    (race) => String(race.raceId) === String(raceId)
  );
  const selectedReferee = availableReferees.find(
    (referee) => String(refereeId(referee)) === String(selectedRefereeId)
  );

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-brown-700/15 bg-cream-100 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-brown-700/10 bg-cream-200/45 px-6 py-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">
            Phân công Referee
          </p>
          <h2 className="mt-2 text-2xl font-black text-brown-900">
            {replacing ? 'Thay Referee đã phân công' : 'Phân công Referee cho Race'}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Chọn Race hợp lệ và Referee ACTIVE. Lịch làm việc sẽ được kiểm tra khi lưu.
          </p>
        </header>

        <div className="grid gap-5 px-6 py-5">
          {replacing && (
            <div className="rounded-lg border border-gold-400/35 bg-gold-400/10 p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-brown-500">
                Referee hiện tại
              </p>
              <p className="mt-1 font-black text-brown-900">
                {action.assignment.refereeName}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-500">
                {action.assignment.refereeEmail}
              </p>
            </div>
          )}

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">Race</span>

            <select
              className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:opacity-60"
              value={raceId}
              disabled={replacing}
              onChange={(event) => setRaceId(event.target.value)}
            >
              <option value="">Chọn Race hợp lệ</option>

              {races.map((race) => (
                <option key={race.raceId} value={race.raceId}>
                  {race.tournamentName} · {race.raceName} · {formatDateTime(race.raceStartTime)}
                </option>
              ))}
            </select>
          </label>

          {selectedRace && (
            <div className="grid gap-3 rounded-lg border border-brown-700/10 bg-white p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {selectedRace.tournamentName}
                </p>
                <p className="mt-1 text-lg font-black text-brown-900">
                  {selectedRace.raceName}
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CalendarDays className="mt-0.5 shrink-0 text-brown-500" size={17} />
                <span className="font-bold text-slate-600">
                  {formatDateTime(selectedRace.raceStartTime)}
                  {selectedRace.raceEndTime && ` – ${formatTime(selectedRace.raceEndTime)}`}
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="mt-0.5 shrink-0 text-brown-500" size={17} />
                <span className="font-bold text-slate-600">
                  {selectedRace.trackName || selectedRace.venue || 'Chưa xác định đường đua'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="inline-flex rounded-full border border-green-700/15 bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800">
                  {formatStatus(selectedRace.raceStatus || selectedRace.status)}
                </span>
              </div>
            </div>
          )}

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">
              Referee
            </span>

            <select
              className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              value={selectedRefereeId}
              onChange={(event) => setSelectedRefereeId(event.target.value)}
            >
              <option value="">Chọn Referee ACTIVE</option>

              {availableReferees.map((referee) => (
                <option
                  key={refereeId(referee)}
                  value={refereeId(referee)}
                >
                  {referee.fullName} · {referee.email}
                </option>
              ))}
            </select>
          </label>

          {selectedReferee && (
            <div className="flex items-center gap-3 rounded-lg border border-brown-700/10 bg-white p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brown-700 text-sm font-black text-white">
                {(selectedReferee.fullName || 'R').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-black text-brown-900">{selectedReferee.fullName}</p>
                <p className="truncate text-sm font-semibold text-slate-500">{selectedReferee.email}</p>
              </div>
              <span className="ml-auto rounded-full bg-green-50 px-3 py-1 text-xs font-extrabold text-green-800">
                ACTIVE
              </span>
            </div>
          )}

          {availableReferees.length === 0 && (
            <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
              <AlertTriangle className="mt-0.5 shrink-0" size={19} />
              <p className="text-sm font-bold">Không còn Referee ACTIVE nào khác cho phân công này.</p>
            </div>
          )}

          {error && (
            <div className="flex gap-3 rounded-lg border border-danger/25 bg-danger-bg p-4 text-danger" role="alert">
              <AlertTriangle className="mt-0.5 shrink-0" size={19} />
              <div>
                <p className="font-extrabold">Không thể lưu phân công</p>
                <p className="mt-1 text-sm font-semibold">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <Clock3 className="mt-0.5 shrink-0" size={19} />
            <p className="text-sm font-semibold">
              Backend ngăn lịch làm việc bị trùng và không cho phép phân công sau khi Race bắt đầu.
            </p>
          </div>
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-brown-700/10 bg-white/60 px-6 py-4">
          <button
            className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-extrabold text-brown-700"
            type="button"
            disabled={isProcessing}
            onClick={onClose}
          >
            Đóng
          </button>

          <button
            className="rounded-lg bg-brown-700 px-4 py-3 font-extrabold text-white transition hover:bg-brown-900 disabled:opacity-50"
            type="button"
            disabled={isProcessing || !raceId || !selectedRefereeId}
            onClick={() => onConfirm(Number(raceId), Number(selectedRefereeId))}
          >
            {isProcessing
              ? 'Đang lưu...'
              : replacing
                ? 'Thay Referee'
                : 'Xác nhận phân công'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function RemoveModal({ assignment, isProcessing, error, onClose, onConfirm }) {
  if (!assignment) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="w-full max-w-md rounded-xl border border-brown-700/15 bg-cream-100 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-extrabold uppercase tracking-widest text-danger">Gỡ phân công</p>
        <h2 className="mt-2 text-2xl font-black text-brown-900">Gỡ Referee?</h2>

        <p className="mt-3 font-semibold text-slate-500">
          Gỡ <strong className="text-brown-900">{assignment.refereeName}</strong> khỏi{' '}
          <strong className="text-brown-900">{assignment.raceName}</strong>?
        </p>

        <div className="mt-4 rounded-lg border border-brown-700/10 bg-white p-4 text-sm">
          <p className="font-extrabold text-brown-900">{assignment.tournamentName}</p>
          <p className="mt-1 font-semibold text-slate-500">
            {formatDateTime(assignment.raceStartTime)} · {assignment.trackName || 'Chưa xác định đường đua'}
          </p>
        </div>

        {error && (
          <div className="mt-4 flex gap-3 rounded-lg border border-danger/25 bg-danger-bg p-4 text-danger" role="alert">
            <AlertTriangle className="mt-0.5 shrink-0" size={19} />
            <div>
              <p className="font-extrabold">Không thể gỡ phân công</p>
              <p className="mt-1 text-sm font-semibold">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-extrabold text-brown-700"
            type="button"
            disabled={isProcessing}
            onClick={onClose}
          >
            Hủy
          </button>

          <button
            className="rounded-lg bg-danger px-4 py-3 font-extrabold text-white disabled:opacity-50"
            type="button"
            disabled={isProcessing}
            onClick={onConfirm}
          >
            {isProcessing ? 'Đang gỡ...' : 'Gỡ bỏ'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function RefereeAssignmentManagement() {
  const [assignments, setAssignments] = useState([]);
  const [referees, setReferees] = useState([]);
  const [eligibleRaces, setEligibleRaces] = useState([]);
  const [action, setAction] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadEligibleRaces(currentAssignments) {
    const tournaments = await getTournaments();

    const racesByTournament = await Promise.all(
      (Array.isArray(tournaments) ? tournaments : []).map(async (tournament) => ({
        tournament,
        races: await getRacesByTournament(tournament.tournamentId)
      }))
    );

    const assignedRaceIds = new Set(
      currentAssignments.map((assignment) => String(assignment.raceId))
    );

    return racesByTournament.flatMap(({ tournament, races }) =>
      (Array.isArray(races) ? races : [])
        .filter(
          (race) =>
            ASSIGNABLE_RACE_STATUSES.has(normalizeStatus(race.status)) &&
            !assignedRaceIds.has(String(race.raceId))
        )
        .map((race) => ({
          ...race,
          tournamentName: tournament.tournamentName
        }))
    );
  }

  async function loadData() {
    setIsLoading(true);
    setError('');

    try {
      const [assignmentData, refereeData] = await Promise.all([
        getRefereeAssignments(),
        getActiveReferees()
      ]);

      const nextAssignments = Array.isArray(assignmentData)
        ? assignmentData
        : [];

      setAssignments(nextAssignments);
      setReferees(Array.isArray(refereeData) ? refereeData : []);
      setEligibleRaces(await loadEligibleRaces(nextAssignments));
    } catch (err) {
      setError(err.message || 'Không thể tải phân công referee.');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return assignments;

    return assignments.filter((assignment) =>
      [
        assignment.tournamentName,
        assignment.raceName,
        assignment.refereeName,
        assignment.refereeEmail
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [assignments, search]);

  async function confirmAssignment(raceId, selectedRefereeId) {
    setIsProcessing(true);
    setActionError('');
    setMessage('');

    try {
      if (action.type === 'replace') {
        await replaceRefereeAssignment(raceId, selectedRefereeId);
        setMessage('Đã thay referee thành công.');
      } else {
        await createRefereeAssignment({
          raceId,
          refereeUserId: selectedRefereeId
        });
        setMessage('Đã phân công referee thành công.');
      }

      setAction(null);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Không thể lưu phân công Referee này.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function confirmRemove() {
    setIsProcessing(true);
    setActionError('');
    setMessage('');

    try {
      await removeRefereeAssignment(removeTarget.raceId);
      setMessage('Đã gỡ phân công referee.');
      setRemoveTarget(null);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Không thể gỡ phân công Referee này.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">
            Admin
          </p>

          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            Phân công Referee
          </h1>

          <p className="mt-3 font-semibold text-slate-500">
            Phân công Referee ACTIVE cho Race hợp lệ và theo dõi lịch làm việc rõ ràng.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 rounded-xl border border-brown-700/20 bg-white px-4 py-3 font-extrabold text-brown-700"
            type="button"
            disabled={isLoading}
            onClick={loadData}
          >
            <RefreshCw size={18} />
            Làm mới
          </button>

          <button
            className="flex items-center gap-2 rounded-xl bg-brown-700 px-4 py-3 font-extrabold text-white shadow-lg transition hover:bg-brown-900 disabled:opacity-50"
            type="button"
            disabled={eligibleRaces.length === 0 || referees.length === 0}
            onClick={() => {
              setActionError('');
              setAction({ type: 'assign' });
            }}
          >
            <ShieldCheck size={18} />
            Phân công Referee
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="flex items-center gap-3 rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 font-bold text-green-700">
          <CheckCircle2 size={19} />
          <span>{message}</span>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: ShieldCheck, label: 'Race đã phân công', value: assignments.length },
          { icon: CalendarDays, label: 'Race hợp lệ', value: eligibleRaces.length },
          { icon: Users, label: 'Referee ACTIVE', value: referees.length }
        ].map(({ icon: Icon, label, value }) => (
          <article className="rounded-xl border border-brown-700/10 bg-cream-100 p-5 shadow-lg" key={label}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-brown-900">{isLoading ? '—' : value}</p>
              </div>
              <span className="grid size-11 place-items-center rounded-lg bg-cream-200 text-brown-700">
                <Icon size={21} />
              </span>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100 shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 px-6 py-5 max-sm:grid">
          <div>
            <h2 className="text-2xl font-black">Phân công hiện tại</h2>
            <p className="mt-2 font-semibold text-slate-500">
              {assignments.length} Race hiện đã có Referee phụ trách
            </p>
          </div>

          <label className="relative block w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />

            <input
              className="w-full rounded-xl border border-brown-700/15 bg-white py-3 pl-10 pr-4 font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Tìm Race, Tournament hoặc Referee"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <div className="grid gap-3 px-6 py-8" aria-label="Đang tải phân công Referee">
            {[1, 2, 3].map((item) => (
              <div className="h-16 animate-pulse rounded-lg bg-cream-200/70" key={item} />
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="grid place-items-center px-6 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-cream-200 text-brown-700">
              <ShieldCheck size={23} />
            </span>
            <p className="mt-4 font-black text-brown-900">
              {search ? 'Không có phân công phù hợp' : 'Chưa có phân công Referee'}
            </p>
            <p className="mt-1 max-w-md text-sm font-semibold text-slate-500">
              {search
                ? 'Hãy thử tên Tournament, Race hoặc Referee khác.'
                : eligibleRaces.length > 0
                  ? 'Phân công Referee ACTIVE cho Race sắp diễn ra và hợp lệ.'
                  : 'Hiện không có Race hợp lệ để phân công.'}
            </p>
          </div>
        ) : (
          <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-cream-200/60">
                <tr>
                  {[
                    'Tournament & Race',
                    'Lịch trình & đường đua',
                    'Referee',
                    'Status',
                    'Thao tác'
                  ].map((heading) => (
                    <th
                      className="border-b border-brown-700/10 px-4 py-4 text-left text-xs font-extrabold uppercase text-brown-700"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map((assignment) => (
                  <tr
                    className="transition hover:bg-cream-200/40"
                    key={assignment.assignmentId}
                  >
                    <td className="w-[27%] border-b border-brown-700/10 px-4 py-4">
                      <p className="truncate text-xs font-extrabold uppercase tracking-wide text-slate-500">{assignment.tournamentName}</p>
                      <p className="mt-1 truncate font-black text-brown-900">{assignment.raceName}</p>
                    </td>

                    <td className="w-[25%] border-b border-brown-700/10 px-4 py-4 text-sm">
                      <p className="flex items-center gap-2 font-bold text-brown-900"><CalendarDays size={15} />{formatDateTime(assignment.raceStartTime)}</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-slate-500"><MapPin size={15} />{assignment.trackName || 'Chưa xác định đường đua'}</p>
                    </td>

                    <td className="w-[20%] border-b border-brown-700/10 px-4 py-4">
                      <strong className="block truncate">{assignment.refereeName}</strong>
                      <small className="mt-1 block text-slate-500">
                        {assignment.refereeEmail}
                      </small>
                    </td>

                    <td className="w-[11%] border-b border-brown-700/10 px-4 py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-800">
                        {formatStatus(assignment.assignmentStatus)}
                      </span>
                    </td>

                    <td className="w-[17%] border-b border-brown-700/10 px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="flex items-center gap-2 rounded-lg border border-brown-700/20 bg-white px-3 py-2 text-sm font-extrabold text-brown-700"
                          type="button"
                          onClick={() => {
                            setActionError('');
                            setAction({ type: 'replace', assignment });
                          }}
                        >
                          <UserRoundCog size={16} />
                          Thay thế
                        </button>

                        <button
                          className="flex items-center gap-2 rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-sm font-extrabold text-danger"
                          type="button"
                          onClick={() => {
                            setActionError('');
                            setRemoveTarget(assignment);
                          }}
                        >
                          <Trash2 size={16} />
                          Gỡ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-4 lg:hidden">
            {filteredAssignments.map((assignment) => (
              <article className="rounded-xl border border-brown-700/10 bg-white p-4 shadow-sm" key={assignment.assignmentId}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold uppercase tracking-wide text-slate-500">{assignment.tournamentName}</p>
                    <h3 className="mt-1 truncate text-lg font-black text-brown-900">{assignment.raceName}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-800">{formatStatus(assignment.assignmentStatus)}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-600">
                  <p className="flex items-center gap-2"><CalendarDays size={16} className="text-brown-500" />{formatDateTime(assignment.raceStartTime)}</p>
                  <p className="flex items-center gap-2"><MapPin size={16} className="text-brown-500" />{assignment.trackName || 'Chưa xác định đường đua'}</p>
                  <p className="flex items-center gap-2"><Users size={16} className="text-brown-500" />{assignment.refereeName} · {assignment.refereeEmail}</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="flex items-center justify-center gap-2 rounded-lg border border-brown-700/20 bg-white px-3 py-2 text-sm font-extrabold text-brown-700" type="button" onClick={() => { setActionError(''); setAction({ type: 'replace', assignment }); }}><UserRoundCog size={16} />Thay thế</button>
                  <button className="flex items-center justify-center gap-2 rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-sm font-extrabold text-danger" type="button" onClick={() => { setActionError(''); setRemoveTarget(assignment); }}><Trash2 size={16} />Gỡ</button>
                </div>
              </article>
            ))}
          </div>
          </>
        )}
      </section>

      <AssignmentModal
        action={action}
        races={
          action?.type === 'replace'
            ? [action.assignment]
            : eligibleRaces
        }
        referees={referees}
        isProcessing={isProcessing}
        error={actionError}
        onClose={() => {
          if (!isProcessing) {
            setAction(null);
            setActionError('');
          }
        }}
        onConfirm={confirmAssignment}
      />

      <RemoveModal
        assignment={removeTarget}
        isProcessing={isProcessing}
        error={actionError}
        onClose={() => {
          if (!isProcessing) {
            setRemoveTarget(null);
            setActionError('');
          }
        }}
        onConfirm={confirmRemove}
      />
    </section>
  );
}
