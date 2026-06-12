import { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRoundCog
} from 'lucide-react';
import {
  getRacesByRound,
  getTournamentRounds,
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

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function refereeId(referee) {
  return referee.id ?? referee.Id;
}

function AssignmentModal({
  action,
  races,
  referees,
  isProcessing,
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

  return (
    <div
      className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        className="w-full max-w-xl rounded-xl border border-brown-700/15 bg-cream-100 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xs font-extrabold uppercase tracking-widest text-brown-500">
          Referee Assignment
        </p>

        <h2 className="mt-2 text-2xl font-black text-brown-900">
          {replacing ? 'Thay trọng tài' : 'Phân công trọng tài'}
        </h2>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">Cuộc đua</span>

            <select
              className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20 disabled:opacity-60"
              value={raceId}
              disabled={replacing}
              onChange={(event) => setRaceId(event.target.value)}
            >
              <option value="">Chọn cuộc đua đủ điều kiện</option>

              {races.map((race) => (
                <option key={race.raceId} value={race.raceId}>
                  {race.tournamentName} · {race.roundName} · {race.raceName}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-extrabold text-brown-900">
              Referee
            </span>

            <select
              className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-bold text-brown-900 outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              value={selectedRefereeId}
              onChange={(event) => setSelectedRefereeId(event.target.value)}
            >
              <option value="">Chọn trọng tài đang hoạt động</option>

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
        </div>

        <p className="mt-4 text-sm font-semibold text-slate-500">
          The backend will reject referees assigned to overlapping races.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-extrabold text-brown-700"
            type="button"
            disabled={isProcessing}
            onClick={onClose}
          >
            Cancel
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
                ? 'Thay trọng tài'
                : 'Phân công trọng tài'}
          </button>
        </div>
      </section>
    </div>
  );
}

function RemoveModal({ assignment, isProcessing, onClose, onConfirm }) {
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
        <h2 className="text-2xl font-black text-brown-900">
          Remove Referee?
        </h2>

        <p className="mt-3 font-semibold text-slate-500">
          Remove {assignment.refereeName} from {assignment.raceName}?
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="rounded-lg border border-brown-700/20 bg-white px-4 py-3 font-extrabold text-brown-700"
            type="button"
            disabled={isProcessing}
            onClick={onClose}
          >
            Cancel
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
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadEligibleRaces(currentAssignments) {
    const tournaments = await getTournaments();

    const openTournaments = (Array.isArray(tournaments) ? tournaments : [])
      .filter((tournament) => tournament.status === 'OpenForRegistration');

    const roundsByTournament = await Promise.all(
      openTournaments.map(async (tournament) => ({
        tournament,
        rounds: await getTournamentRounds(tournament.tournamentId)
      }))
    );

    const roundRecords = roundsByTournament.flatMap(({ tournament, rounds }) =>
      (Array.isArray(rounds) ? rounds : []).map((round) => ({
        tournament,
        round
      }))
    );

    const racesByRound = await Promise.all(
      roundRecords.map(async ({ tournament, round }) => ({
        tournament,
        round,
        races: await getRacesByRound(round.roundId)
      }))
    );

    const assignedRaceIds = new Set(
      currentAssignments.map((assignment) => String(assignment.raceId))
    );

    return racesByRound.flatMap(({ tournament, round, races }) =>
      (Array.isArray(races) ? races : [])
        .filter(
          (race) =>
            race.status === 'Draft' &&
            !assignedRaceIds.has(String(race.raceId))
        )
        .map((race) => ({
          ...race,
          tournamentName: tournament.tournamentName,
          roundName: round.roundName
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
      setError(err.message || 'Không thể tải phân công trọng tài.');
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
        assignment.roundName,
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
    setError('');
    setMessage('');

    try {
      if (action.type === 'replace') {
        await replaceRefereeAssignment(raceId, selectedRefereeId);
        setMessage('Đã thay trọng tài thành công.');
      } else {
        await createRefereeAssignment({
          raceId,
          refereeUserId: selectedRefereeId
        });
        setMessage('Đã phân công trọng tài thành công.');
      }

      setAction(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể lưu phân công trọng tài.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function confirmRemove() {
    setIsProcessing(true);
    setError('');
    setMessage('');

    try {
      await removeRefereeAssignment(removeTarget.raceId);
      setMessage('Đã gỡ phân công trọng tài.');
      setRemoveTarget(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Không thể gỡ phân công trọng tài.');
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
            Referee Assignments
          </h1>

          <p className="mt-3 font-semibold text-slate-500">
            Assign active referees to draft races.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="flex items-center gap-2 rounded-xl border border-brown-700/20 bg-white px-4 py-3 font-extrabold text-brown-700"
            type="button"
            onClick={loadData}
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            className="flex items-center gap-2 rounded-xl bg-brown-700 px-4 py-3 font-extrabold text-white shadow-lg transition hover:bg-brown-900 disabled:opacity-50"
            type="button"
            disabled={eligibleRaces.length === 0}
            onClick={() => setAction({ type: 'assign' })}
          >
            <ShieldCheck size={18} />
            Assign Referee
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 font-bold text-green-700">
          {message}
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100 shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 px-6 py-5 max-sm:grid">
          <div>
            <h2 className="text-2xl font-black">Phân công hiện tại</h2>
            <p className="mt-2 font-semibold text-slate-500">
              {assignments.length} races currently have referees
            </p>
          </div>

          <label className="relative block w-full max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={18}
            />

            <input
              className="w-full rounded-xl border border-brown-700/15 bg-white py-3 pl-10 pr-4 font-bold outline-none focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Tìm kiếm phân công"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="px-6 py-10 text-slate-500">Đang tải phân công...</p>
        ) : filteredAssignments.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">
            No referee assignments found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[950px] w-full border-collapse">
              <thead className="bg-cream-200/60">
                <tr>
                  {[
                    'Giải đấu',
                    'Vòng đấu',
                    'Cuộc đua',
                    'Lịch trình',
                    'Trọng tài',
                    'Trạng thái',
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
                    <td className="border-b border-brown-700/10 px-4 py-4 font-extrabold">
                      {assignment.tournamentName}
                    </td>

                    <td className="border-b border-brown-700/10 px-4 py-4 font-bold">
                      {assignment.roundName}
                    </td>

                    <td className="border-b border-brown-700/10 px-4 py-4 font-extrabold">
                      {assignment.raceName}
                    </td>

                    <td className="border-b border-brown-700/10 px-4 py-4 text-sm font-bold">
                      {formatDateTime(assignment.startTime)}
                    </td>

                    <td className="border-b border-brown-700/10 px-4 py-4">
                      <strong>{assignment.refereeName}</strong>
                      <small className="mt-1 block text-slate-500">
                        {assignment.refereeEmail}
                      </small>
                    </td>

                    <td className="border-b border-brown-700/10 px-4 py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-800">
                        {assignment.assignmentStatus}
                      </span>
                    </td>

                    <td className="border-b border-brown-700/10 px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          className="flex items-center gap-2 rounded-lg border border-brown-700/20 bg-white px-3 py-2 text-sm font-extrabold text-brown-700"
                          type="button"
                          onClick={() =>
                            setAction({ type: 'replace', assignment })
                          }
                        >
                          <UserRoundCog size={16} />
                          Replace
                        </button>

                        <button
                          className="flex items-center gap-2 rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-sm font-extrabold text-danger"
                          type="button"
                          onClick={() => setRemoveTarget(assignment)}
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        onClose={() => !isProcessing && setAction(null)}
        onConfirm={confirmAssignment}
      />

      <RemoveModal
        assignment={removeTarget}
        isProcessing={isProcessing}
        onClose={() => !isProcessing && setRemoveTarget(null)}
        onConfirm={confirmRemove}
      />
    </section>
  );
}
