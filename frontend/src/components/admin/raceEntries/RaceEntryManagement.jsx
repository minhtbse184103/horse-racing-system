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
  getRaceEntriesByRace
} from '../../../services/raceEntryService';

function formatStatus(status) {
  return String(status || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
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

  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [selectedRaceId, setSelectedRaceId] = useState('');
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('');

  const [confirmation, setConfirmation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [entrySearch, setEntrySearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const selectedTournament = tournaments.find(
    (item) => String(item.tournamentId) === String(selectedTournamentId)
  );

  const selectedRace = races.find(
    (item) => String(item.raceId) === String(selectedRaceId)
  );

  const confirmedRegistrations = useMemo(() => {
    const assignedRegistrationIds = new Set(
      entries.map((entry) => String(entry.registrationId))
    );

    return registrations.filter(
      (registration) =>
        registration.status === 'CONFIRMED' &&
        String(registration.tournamentId) === String(selectedTournamentId) &&
        !assignedRegistrationIds.has(String(registration.registrationId))
    );
  }, [registrations, selectedTournamentId, entries]);

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

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setIsLoading(true);
    setError('');

    try {
      const [tournamentData, historyData] = await Promise.all([
        getTournaments(),
        getRegistrationHistory()
      ]);

      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setRegistrations(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError(err.message || 'Unable to load RaceEntry data.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTournamentChange(tournamentId) {
    setSelectedTournamentId(tournamentId);
    setSelectedRoundId('');
    setSelectedRaceId('');
    setSelectedRegistrationId('');
    setRounds([]);
    setRaces([]);
    setEntries([]);
    setEntrySearch('');
    setError('');
    setMessage('');

    if (!tournamentId) return;

    try {
      const data = await getTournamentRounds(tournamentId);
      setRounds(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load tournament rounds.');
    }
  }

  async function handleRoundChange(roundId) {
    setSelectedRoundId(roundId);
    setSelectedRaceId('');
    setSelectedRegistrationId('');
    setRaces([]);
    setEntries([]);
    setEntrySearch('');
    setError('');
    setMessage('');

    if (!roundId) return;

    try {
      const data = await getRacesByRound(roundId);
      setRaces(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Unable to load races.');
    }
  }

  async function handleRaceChange(raceId) {
    setSelectedRaceId(raceId);
    setSelectedRegistrationId('');
    setEntries([]);
    setEntrySearch('');
    setError('');
    setMessage('');

    if (!raceId) return;

    await loadEntries(raceId);
  }

  async function loadEntries(raceId) {
    try {
      const data = await getRaceEntriesByRace(raceId);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setEntries([]);
      setError(err.message || 'Unable to load race entries.');
    }
  }

  function requestAssignment() {
    if (!selectedRaceId || !selectedRegistrationId) {
      setError('Select a race and confirmed registration.');
      return;
    }

    const registration = registrationById.get(
      String(selectedRegistrationId)
    );

    setConfirmation({
      race: selectedRace,
      registration
    });
  }

  async function assignRegistration() {
    setIsAssigning(true);
    setConfirmation(null);
    setError('');
    setMessage('');

    try {
      await createRaceEntry({
        raceId: Number(selectedRaceId),
        registrationId: Number(selectedRegistrationId)
      });

      setSelectedRegistrationId('');
      setMessage('Registration assigned successfully.');
      await loadEntries(selectedRaceId);
    } catch (err) {
      setError(err.message || 'Unable to assign registration.');
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
    {isLoading ? 'Loading...' : 'Refresh'}
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

      <section className="relative z-20 overflow-visible rounded-xl border border-brown-700/10 bg-cream-100/90 p-6 shadow-[0_18px_45px_rgba(78,44,25,0.12)]">
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <PrettySelect
            label="Tournament"
            placeholder="Select tournament"
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
            label="Round"
            placeholder="Select round"
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
            label="Race"
            placeholder="Select race"
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

        {selectedRaceId && (
     <div className="mt-6 grid grid-cols-1 items-end gap-4 border-t border-brown-700/10 pt-6 lg:grid-cols-[minmax(180px,0.7fr)_minmax(260px,1fr)_auto]">
  <div className="grid gap-1">
    <span className="text-xs font-extrabold uppercase text-slate-500">
      Selected Race
    </span>

    <strong className="text-lg text-brown-900">
      {selectedRace?.raceName}
    </strong>

    <small className="text-sm text-slate-500">
      {selectedTournament?.tournamentName} · {selectedRace?.distance}m
    </small>
  </div>

            <PrettySelect
              placeholder="Select confirmed registration"
              value={selectedRegistrationId}
              onChange={setSelectedRegistrationId}
              options={confirmedRegistrations.map((registration) => ({
                value: registration.registrationId,
                label: registration.horseName,
                meta: `#${registration.registrationId} · ${registration.jockeyName}`,
                status: registration.status
              }))}
            />

            <button
              className="rounded-xl border border-brown-700 bg-brown-700 px-5 py-4 font-extrabold text-white shadow-[0_8px_20px_rgba(108,63,36,0.2)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              type="button"
              disabled={!selectedRegistrationId || isAssigning}
              onClick={requestAssignment}
            >
              Assign to Race
            </button>
          </div>
        )}
      </section>

      <section className="relative z-10 overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100/90 shadow-[0_18px_45px_rgba(78,44,25,0.12)]">
        <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/50 px-6 py-5 max-sm:grid">
          <div>
            <h2 className="text-2xl font-extrabold text-brown-900">
              Assigned Entries
            </h2>

            <p className="mt-2 text-slate-500">
              {selectedRace
                ? `${filteredEntries.length} of ${entries.length} entries assigned to ${selectedRace.raceName}`
                : 'Select a race to view assigned entries'}
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
                placeholder="Search lane, horse, owner, or jockey"
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
            <table className="w-full table-fixed border-collapse">
              <thead className="bg-cream-200/60">
                <tr>
                  {[
                    'Lane',
                    'Registration',
                    'Horse',
                    'Owner',
                    'Jockey',
                    'Status'
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

      {confirmation && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm max-sm:items-end max-sm:p-3"
          onClick={() => setConfirmation(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-lg border border-brown-700/20 bg-cream-100 p-7 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-green-700 max-sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-green-100 text-xl font-black text-green-700">
                ✓
              </span>

              <div>
                <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">
                  Race Assignment
                </span>
                <h2 className="text-xl font-extrabold text-brown-900">
                  Assign Registration
                </h2>
              </div>
            </div>

            <p className="my-5 leading-relaxed text-slate-500">
              The backend will automatically assign the next lane number.
            </p>

            <dl className="grid overflow-hidden rounded-lg border border-brown-700/10 bg-brown-700/10">
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Race</dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {confirmation.race?.raceName}
                </dd>
              </div>

              <div className="mt-px grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Horse</dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {confirmation.registration?.horseName}
                </dd>
              </div>

              <div className="mt-px grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Jockey</dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {confirmation.registration?.jockeyName}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-3 max-sm:grid max-sm:grid-cols-1">
              <button
                className="min-h-11 rounded-lg border border-brown-700/20 bg-white/70 px-4 py-2 font-extrabold text-brown-700 transition hover:bg-cream-200"
                type="button"
                onClick={() => setConfirmation(null)}
              >
                Go Back
              </button>

              <button
                className="min-h-11 rounded-lg border border-green-700 bg-green-700 px-4 py-2 font-extrabold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={isAssigning}
                onClick={assignRegistration}
              >
                Assign Registration
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
