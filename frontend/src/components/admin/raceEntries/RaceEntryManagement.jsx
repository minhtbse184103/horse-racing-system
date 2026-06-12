import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getRegistrationHistory } from '../../../services/adminRegistrationService';
import {
  getRacesByRound,
  getTournamentRounds,
  getTournaments
} from '../../../services/eventService';
import {
  createRaceEntry,
  getRaceEntriesByRace,
  getRaceEntryAssignmentQueue,
  getUnassignedRaceEntriesByRound
} from '../../../services/raceEntryService';
import { formatDisplayLabel } from '../../../lib';

function formatStatus(status) {
  return formatDisplayLabel(status);
}
function getStatusClasses(status) {
  switch (String(status || '').toLowerCase()) {
    case 'openforregistration':
    case 'confirmed':
    case 'assigned':
      return 'bg-green-100 text-green-800';

    case 'draft':
      return 'bg-amber-100 text-amber-800';

    case 'cancelled':
    case 'rejected':
      return 'bg-red-100 text-red-700';

    case 'closedregistration':
      return 'bg-stone-200 text-stone-700';

    default:
      return 'bg-cream-200 text-brown-700';
  }
}
function PrettySelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  return (
    <div className="relative min-w-0">
      {label && (
        <span className="mb-2 block text-sm font-bold text-brown-900">
          {label}
        </span>
      )}

      <button
        className={`
          grid min-h-16 w-full grid-cols-[minmax(0,1fr)_auto_auto]
          items-center gap-3 rounded-xl border bg-white/90 px-4 py-3 shadow-sm
          text-left text-brown-900 transition
          ${
            isOpen
              ? 'border-brown-700 shadow-[0_0_0_3px_rgba(217,164,65,0.18)]'
              : 'border-brown-700/20 hover:border-brown-700/50'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="grid min-w-0 gap-1">
          <strong className="truncate">
            {selectedOption?.label || placeholder}
          </strong>

          {selectedOption?.meta && (
            <small className="truncate text-xs text-slate-500">
              {selectedOption.meta}
            </small>
          )}
        </span>

        {selectedOption?.status && (
          <span
            className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-extrabold ${getStatusClasses(
              selectedOption.status
            )}`}
          >
            {formatStatus(selectedOption.status)}
          </span>
        )}

        <span
          className={`text-brown-700 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>

      {isOpen && (
        <div
          className="
            absolute left-0 right-0 top-[calc(100%+7px)] z-50
            max-h-72 overflow-y-auto rounded-xl border border-brown-700/20
            bg-cream-100 p-2 shadow-2xl
          "
          role="listbox"
        >
          {options.length === 0 ? (
            <span className="block p-4 text-center text-sm text-slate-500">
              No options available
            </span>
          ) : (
            options.map((option) => {
              const isSelected = String(option.value) === String(value);

              return (
                <button
                  className={`
                    grid w-full grid-cols-[minmax(0,1fr)_auto] items-center
                    gap-3 rounded-md px-3 py-3 text-left text-brown-900
                    transition hover:bg-cream-200
                    ${isSelected ? 'bg-cream-200' : ''}
                  `}
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="grid min-w-0 gap-1">
                    <strong className="truncate">{option.label}</strong>

                    {option.meta && (
                      <small className="truncate text-xs text-slate-500">
                        {option.meta}
                      </small>
                    )}
                  </span>

                  {option.status && (
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs font-extrabold ${getStatusClasses(
                        option.status
                      )}`}
                    >
                      {formatStatus(option.status)}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function RaceEntryManagement() {
  const [tournaments, setTournaments] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [races, setRaces] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [assignmentQueue, setAssignmentQueue] = useState([]);
  const [unassignedEntries, setUnassignedEntries] = useState([]);

  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');

  const [assignmentTarget, setAssignmentTarget] = useState(null);
  const [assignmentRaceId, setAssignmentRaceId] = useState('');
  const [assignmentRaces, setAssignmentRaces] = useState([]);
  const [isLoadingAssignmentRaces, setIsLoadingAssignmentRaces] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [entrySearch, setEntrySearch] = useState('');
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [queueSearch, setQueueSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedRace = races.find(
    (item) => String(item.raceId) === String(selectedRaceId)
  );

  const registrationById = useMemo(
    () =>
      new Map(
        registrations.map((registration) => [
          String(registration.registrationId),
          registration
        ])
      ),
    [registrations]
  );

  const filteredEntries = useMemo(() => {
    const query = entrySearch.trim().toLowerCase();

    if (!query) return entries;

    return entries.filter((entry) => {
      const registration = registrationById.get(String(entry.registrationId));

      return [
        entry.laneNumber,
        entry.registrationId,
        entry.status,
        registration?.horseName,
        registration?.ownerName,
        registration?.jockeyName
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [entries, entrySearch, registrationById]);

  const filteredUnassignedRegistrations = useMemo(() => {
    const query = unassignedSearch.trim().toLowerCase();

    if (!query) return unassignedEntries;

    return unassignedEntries.filter((registration) =>
      [
        registration.registrationId,
        registration.tournamentName,
        registration.horseName,
        registration.ownerName,
        registration.jockeyName,
        registration.registrationStatus
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [unassignedEntries, unassignedSearch]);

  const filteredAssignmentQueue = useMemo(() => {
    const query = queueSearch.trim().toLowerCase();

    if (!query) return assignmentQueue;

    return assignmentQueue.filter((candidate) =>
      [
        candidate.registrationId,
        candidate.tournamentName,
        candidate.roundName,
        candidate.horseName,
        candidate.ownerName,
        candidate.jockeyName
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [assignmentQueue, queueSearch]);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setIsLoading(true);
    setError('');

    try {
      const [tournamentData, historyData, queueData] = await Promise.all([
        getTournaments(),
        getRegistrationHistory(),
        getRaceEntryAssignmentQueue()
      ]);

      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setRegistrations(Array.isArray(historyData) ? historyData : []);
      setAssignmentQueue(Array.isArray(queueData) ? queueData : []);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu suất tham gia đua.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTournamentChange(tournamentId) {
    setSelectedTournamentId(tournamentId);
    setSelectedRoundId('');
    setSelectedRaceId('');
    setRounds([]);
    setRaces([]);
    setEntries([]);
    setUnassignedEntries([]);
    setEntrySearch('');
    setUnassignedSearch('');
    setError('');
    setMessage('');

    if (!tournamentId) return;

    try {
      const data = await getTournamentRounds(tournamentId);
      setRounds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải các vòng đấu.');
    }
  }

  async function handleRoundChange(roundId) {
    setSelectedRoundId(roundId);
    setSelectedRaceId('');
    setRaces([]);
    setEntries([]);
    setUnassignedEntries([]);
    setEntrySearch('');
    setUnassignedSearch('');
    setError('');
    setMessage('');

    if (!roundId) return;

    try {
      const data = await getRacesByRound(roundId);
      const nextRaces = Array.isArray(data) ? data : [];
      setRaces(nextRaces);
      await loadUnassignedEntries(roundId);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách cuộc đua.');
    }
  }

  async function handleRaceChange(raceId) {
    setSelectedRaceId(raceId);
    setEntries([]);
    setEntrySearch('');
    setUnassignedSearch('');
    setError('');
    setMessage('');

    if (!raceId) return;

    await loadEntries(raceId);
  }

  async function openAssignment(candidate) {
    setError('');
    setMessage('');
    setAssignmentTarget(candidate);
    setAssignmentRaceId('');
    setAssignmentRaces([]);
    setIsLoadingAssignmentRaces(true);

    try {
      const data = await getRacesByRound(candidate.roundId || selectedRoundId);
      const eligibleRaces = (Array.isArray(data) ? data : []).filter(
        (race) => String(race.status).toLowerCase() === 'draft'
      );
      setAssignmentRaces(eligibleRaces);
    } catch (err) {
      setAssignmentTarget(null);
      setError(err.message || 'Không thể tải các cuộc đua bản nháp đủ điều kiện.');
    } finally {
      setIsLoadingAssignmentRaces(false);
    }
  }

  async function loadEntries(raceId) {
    try {
      const data = await getRaceEntriesByRace(raceId);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setEntries([]);
      setError(err.message || 'Không thể tải suất tham gia đua.');
    }
  }

  async function loadUnassignedEntries(roundId = selectedRoundId) {
    if (!roundId) {
      setUnassignedEntries([]);
      return;
    }
    try {
      const data = await getUnassignedRaceEntriesByRound(roundId);
      setUnassignedEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setUnassignedEntries([]);
      setError(err.message || 'Không thể tải đơn đăng ký chưa phân công của vòng này.');
    }
  }

  async function assignRegistration() {
    if (!assignmentTarget || !assignmentRaceId) return;

    setIsAssigning(true);
    setError('');
    setMessage('');

    try {
      await createRaceEntry({
        raceId: Number(assignmentRaceId),
        registrationId: Number(assignmentTarget.registrationId)
      });

      setMessage(
        `${assignmentTarget.horseName || `Registration #${assignmentTarget.registrationId}`} assigned successfully.`
      );
      setAssignmentTarget(null);
      setAssignmentRaceId('');
      setAssignmentRaces([]);
      const [queueData] = await Promise.all([
        getRaceEntryAssignmentQueue(),
        selectedRaceId ? loadEntries(selectedRaceId) : Promise.resolve(),
        selectedRoundId ? loadUnassignedEntries(selectedRoundId) : Promise.resolve()
      ]);
      setAssignmentQueue(Array.isArray(queueData) ? queueData : []);
    } catch (err) {
      setError(err.message || 'Không thể phân công đơn đăng ký.');
    } finally {
      setIsAssigning(false);
    }
  }

  return (
    <section className="space-y-6 text-brown-900">
          
<header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
  <div>
    <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-brown-500">
      Admin
    </p>

    <h1 className="text-4xl font-black text-brown-900 md:text-5xl">
      Race Entries
    </h1>

    <p className="mt-3 text-slate-500">
      Assign confirmed registrations to draft races.
    </p>
  </div>

  <button
    className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brown-700/40 hover:bg-cream-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    type="button"
    onClick={loadInitialData}
    disabled={isLoading}
  >
    {isLoading ? 'Đang tải...' : 'Làm mới'}
  </button>
</header>
      {error && (
  <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-danger">
    {error}
  </div>
)}

{message && (
  <div className="rounded-lg border border-green-700/20 bg-green-50 px-4 py-3 text-green-700">
    {message}
  </div>
)}

      <section className="overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100/90 shadow-[0_18px_45px_rgba(78,44,25,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 px-6 py-5 max-sm:grid">
          <div>
            <h2 className="text-2xl font-extrabold text-brown-900">
              Qualified Assignment Queue
            </h2>
            <p className="mt-2 text-slate-500">
              {filteredAssignmentQueue.length} of {assignmentQueue.length} confirmed registrations waiting for their first race
            </p>
          </div>

          {assignmentQueue.length > 0 && (
            <label className="relative block w-full max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
              <input
                className="w-full rounded-xl border border-brown-700/15 bg-white/90 py-3 pl-10 pr-4 text-sm font-bold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                placeholder="Tìm giải đấu, ngựa, chủ ngựa hoặc nài ngựa"
                value={queueSearch}
                onChange={(event) => setQueueSearch(event.target.value)}
              />
            </label>
          )}
        </div>

        {isLoading ? (
          <p className="px-6 py-10 text-slate-500">Đang tải hàng chờ phân công...</p>
        ) : assignmentQueue.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">
            No confirmed registrations are waiting for Qualified assignment.
          </p>
        ) : filteredAssignmentQueue.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">
            No assignment queue entries match your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[860px] w-full table-fixed border-collapse">
              <thead className="bg-cream-200/60">
                <tr>
                  {['Đăng ký', 'Giải đấu', 'Vòng đấu', 'Ngựa', 'Chủ ngựa', 'Nài ngựa', 'Action'].map(
                    (heading) => (
                      <th
                        className="border-b border-brown-700/10 px-3 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-brown-700"
                        key={heading}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredAssignmentQueue.map((candidate) => (
                  <tr
                    className="transition hover:bg-cream-200/40"
                    key={candidate.registrationId}
                  >
                    <td className="border-b border-brown-700/10 px-3 py-4 text-sm font-extrabold">
                      #{candidate.registrationId}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-3 py-4 text-sm font-extrabold">
                      {candidate.tournamentName || `Tournament #${candidate.tournamentId}`}
                    </td>
                    <td className="border-b border-brown-700/10 px-3 py-4 text-sm font-extrabold">
                      {candidate.roundName || 'Qualified'}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-3 py-4 text-sm font-extrabold">
                      {candidate.horseName || 'N/A'}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-3 py-4 text-sm font-extrabold">
                      {candidate.ownerName || 'N/A'}
                    </td>
                    <td className="break-words border-b border-brown-700/10 px-3 py-4 text-sm font-extrabold">
                      {candidate.jockeyName || 'N/A'}
                    </td>
                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <button
                        className="rounded-lg border border-brown-700 bg-brown-700 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-brown-900"
                        type="button"
                        onClick={() => openAssignment(candidate)}
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="relative z-20 overflow-visible rounded-xl border border-brown-700/10 bg-cream-100/90 p-6 shadow-[0_18px_45px_rgba(78,44,25,0.12)]">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold text-brown-900">
            Search Assignments
          </h2>
          <p className="mt-2 text-slate-500">
            Select a tournament, round, and race to view its assigned and
            available entries.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PrettySelect
            label="Giải đấu"
            placeholder="Chọn giải đấu"
            value={selectedTournamentId}
            onChange={handleTournamentChange}
            options={tournaments.map((tournament) => ({
              value: tournament.tournamentId,
              label: tournament.tournamentName,
              meta: `Tournament #${tournament.tournamentId}`,
              status: tournament.status
            }))}
          />

          <PrettySelect
            label="Vòng đấu"
            placeholder="Chọn vòng đấu"
            value={selectedRoundId}
            disabled={!selectedTournamentId}
            onChange={handleRoundChange}
            options={rounds.map((round) => ({
              value: round.roundId,
              label: round.roundName,
              meta: `Round ${round.roundOrder}`,
              status: round.status
            }))}
          />

          <PrettySelect
            label="Cuộc đua"
            placeholder="Chọn cuộc đua"
            value={selectedRaceId}
            disabled={!selectedRoundId}
            onChange={handleRaceChange}
            options={races.map((race) => ({
              value: race.raceId,
              label: race.raceName,
              meta: `${race.distance}m`,
              status: race.status
            }))}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
      <section className="relative z-10 min-w-0 overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100/90 shadow-[0_18px_45px_rgba(78,44,25,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 px-6 py-5 max-sm:grid">
          <div>
            <h2 className="text-2xl font-extrabold text-brown-900">
              Assigned Entries
            </h2>

            <p className="mt-2 text-slate-500">
              {selectedRace
                ? `${filteredEntries.length} of ${entries.length} entries assigned to ${selectedRace.raceName}`
                : 'Chọn cuộc đua để xem các suất đã phân công'}
            </p>
          </div>

          {selectedRaceId && entries.length > 0 && (
            <label className="relative block w-full max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
              <input
                className="w-full rounded-xl border border-brown-700/15 bg-white/90 py-3 pl-10 pr-4 text-sm font-bold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                placeholder="Tìm theo làn, ngựa, chủ ngựa hoặc nài ngựa"
                value={entrySearch}
                onChange={(event) => setEntrySearch(event.target.value)}
              />
            </label>
          )}
        </div>

        {!selectedRaceId ? (
          <p className="px-6 py-10 text-slate-500">
            Select a tournament, round, and race.
          </p>
        ) : entries.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">
            No registrations assigned to this race.
          </p>
        ) : filteredEntries.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">
            No assigned entries match your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[680px] w-full table-fixed border-collapse">
              <thead className="bg-cream-200/60">
                <tr>
                  {[
                    'Làn đua',
                    'Đăng ký',
                    'Ngựa',
                    'Chủ ngựa',
                    'Nài ngựa',
                    'Trạng thái'
                  ].map((heading) => (
                    <th
                      className="border-b border-brown-700/10 px-3 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-brown-700"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredEntries.map((entry) => {
                  const registration = registrationById.get(
                    String(entry.registrationId)
                  );

                  return (
                    <tr
                      className="transition hover:bg-cream-200/40"
                      key={entry.raceEntryId}
                    >
                      <td className="border-b border-brown-700/10 px-3 py-4">
                        <strong className="inline-grid size-9 place-items-center rounded-full bg-brown-700 text-white">
                          {entry.laneNumber}
                        </strong>
                      </td>

                      <td className="border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold text-brown-900">
                        #{entry.registrationId}
                      </td>

                      <td className="break-words border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                        {registration?.horseName || 'N/A'}
                      </td>

                      <td className="break-words border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                        {registration?.ownerName || 'N/A'}
                      </td>

                      <td className="break-words border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                        {registration?.jockeyName || 'N/A'}
                      </td>

                      <td className="border-b border-brown-700/10 px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                            entry.status
                          )}`}
                        >
                          {formatStatus(entry.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="relative z-10 min-w-0 overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100/90 shadow-[0_18px_45px_rgba(78,44,25,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 px-6 py-5 max-sm:grid">
          <div>
            <h2 className="text-2xl font-extrabold text-brown-900">
              Unassigned Entries
            </h2>

            <p className="mt-2 text-slate-500">
              {selectedRoundId
                ? `${filteredUnassignedRegistrations.length} of ${unassignedEntries.length} confirmed registrations available in this round`
                : 'Chọn giải đấu và vòng đấu để xem các suất chưa phân công'}
            </p>
          </div>

          {selectedRoundId && unassignedEntries.length > 0 && (
            <label className="relative block w-full max-w-sm">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={17}
              />
              <input
                className="w-full rounded-xl border border-brown-700/15 bg-white/90 py-3 pl-10 pr-4 text-sm font-bold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                placeholder="Tìm theo ngựa, chủ ngựa hoặc nài ngựa"
                value={unassignedSearch}
                onChange={(event) => setUnassignedSearch(event.target.value)}
              />
            </label>
          )}
        </div>

        {!selectedRoundId ? (
          <p className="px-6 py-10 text-slate-500">
            Select a tournament and round.
          </p>
        ) : unassignedEntries.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">
            No confirmed registrations are available for this round.
          </p>
        ) : filteredUnassignedRegistrations.length === 0 ? (
          <p className="px-6 py-10 text-slate-500">
            No unassigned entries match your search.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full table-fixed border-collapse">
              <thead className="bg-cream-200/60">
                <tr>
                  {['Đăng ký', 'Ngựa', 'Chủ ngựa', 'Nài ngựa', 'Trạng thái', 'Action'].map(
                    (heading) => (
                      <th
                        className="border-b border-brown-700/10 px-3 py-4 text-left text-xs font-extrabold uppercase tracking-wide text-brown-700"
                        key={heading}
                      >
                        {heading}
                      </th>
                    )
                  )}
                </tr>
              </thead>

              <tbody>
                {filteredUnassignedRegistrations.map((registration) => (
                  <tr
                    className="transition hover:bg-cream-200/40"
                    key={registration.registrationId}
                  >
                    <td className="border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold text-brown-900">
                      #{registration.registrationId}
                    </td>

                    <td className="break-words border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                      {registration.horseName || 'N/A'}
                    </td>

                    <td className="break-words border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                      {registration.ownerName || 'N/A'}
                    </td>

                    <td className="break-words border-b border-brown-700/10 px-3 py-4 text-[0.82rem] font-extrabold leading-snug text-brown-900">
                      {registration.jockeyName || 'N/A'}
                    </td>

                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                          registration.registrationStatus
                        )}`}
                      >
                        {formatStatus(registration.registrationStatus)}
                      </span>
                    </td>

                    <td className="border-b border-brown-700/10 px-3 py-4">
                      <button
                        className="rounded-lg border border-brown-700 bg-brown-700 px-3 py-2 text-sm font-extrabold text-white transition hover:bg-brown-900"
                        type="button"
                        onClick={() => openAssignment(registration)}
                      >
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>

      {assignmentTarget && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm max-sm:items-end max-sm:p-3"
          onClick={() => !isAssigning && setAssignmentTarget(null)}
        >
          <div
            className="relative w-full max-w-2xl overflow-visible rounded-xl border border-brown-700/20 bg-cream-100 p-7 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-brown-700 max-sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-cream-200 text-xl font-black text-brown-700">
                {assignmentTarget.horseName?.charAt(0) || '#'}
              </span>

              <div>
                <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">
                  Quick Assignment
                </span>
                <h2 className="text-xl font-extrabold text-brown-900">
                  Choose a Draft Race
                </h2>
              </div>
            </div>

            <p className="my-5 leading-relaxed text-slate-500">
              Tournament and round are already matched. Choose the destination
              race and the next lane number will be generated automatically.
            </p>

            <dl className="mb-5 grid overflow-hidden rounded-lg border border-brown-700/10 bg-brown-700/10 sm:grid-cols-2">
              <div className="grid gap-1 bg-white/70 px-4 py-3">
                <dt className="text-xs font-extrabold uppercase text-slate-500">
                  Tournament
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {assignmentTarget.tournamentName ||
                    `Tournament #${assignmentTarget.tournamentId}`}
                </dd>
              </div>

              <div className="grid gap-1 bg-white/70 px-4 py-3 sm:ml-px">
                <dt className="text-xs font-extrabold uppercase text-slate-500">
                  Round
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {assignmentTarget.roundName || 'Vòng đấu đã chọn'}
                </dd>
              </div>

              <div className="mt-px grid gap-1 bg-white/70 px-4 py-3">
                <dt className="text-xs font-extrabold uppercase text-slate-500">
                  Horse
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {assignmentTarget.horseName || 'N/A'}
                </dd>
              </div>

              <div className="mt-px grid gap-1 bg-white/70 px-4 py-3 sm:ml-px">
                <dt className="text-xs font-extrabold uppercase text-slate-500">
                  Jockey
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {assignmentTarget.jockeyName || 'N/A'}
                </dd>
              </div>
            </dl>

            {isLoadingAssignmentRaces ? (
              <p className="rounded-xl border border-brown-700/10 bg-white/70 px-4 py-6 text-center font-bold text-slate-500">
                Loading eligible races...
              </p>
            ) : assignmentRaces.length === 0 ? (
              <p className="rounded-xl border border-amber-700/20 bg-amber-50 px-4 py-4 font-bold text-amber-800">
                No draft races are available in this round.
              </p>
            ) : (
              <PrettySelect
                label="Cuộc đua đích"
                placeholder="Chọn cuộc đua bản nháp"
                value={assignmentRaceId}
                onChange={setAssignmentRaceId}
                options={assignmentRaces.map((race) => ({
                  value: race.raceId,
                  label: race.raceName,
                  meta: `${race.distance}m`,
                  status: race.status
                }))}
              />
            )}

            <div className="mt-6 flex justify-end gap-3 max-sm:grid max-sm:grid-cols-1">
              <button
                className="min-h-11 rounded-lg border border-brown-700/20 bg-white/70 px-4 py-2 font-extrabold text-brown-700 transition hover:bg-cream-200"
                type="button"
                disabled={isAssigning}
                onClick={() => setAssignmentTarget(null)}
              >
                Cancel
              </button>

              <button
                className="min-h-11 rounded-lg border border-green-700 bg-green-700 px-4 py-2 font-extrabold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={
                  isAssigning ||
                  isLoadingAssignmentRaces ||
                  !assignmentRaceId
                }
                onClick={assignRegistration}
              >
                {isAssigning ? 'Đang phân công...' : 'Xác nhận phân công'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
