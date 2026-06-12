import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  cancelTournament,
  createTournament,
  getTournamentConditions,
  getTournamentRounds,
  getTournaments,
  openTournamentRegistration,
  updateTournament
} from '../../../services/eventService';
import RaceManagement from './RaceManagement';
function emptyTournamentForm() {
  return {
    tournamentName: '',
    location: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    minParticipants: 3,
    maxParticipants: 12,
    conditionId: ''
  };
}

function formatDisplayDate(value) {
  if (!value) return 'N/A';

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatStatus(status) {
  return String(status || 'N/A')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function getStatusClasses(status) {
  switch (String(status || '').toLowerCase()) {
    case 'draft':
      return 'bg-amber-100 text-amber-800';
    case 'openforregistration':
      return 'bg-green-100 text-green-800';
    case 'closedregistration':
      return 'bg-stone-200 text-stone-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-cream-200 text-brown-700';
  }
}

export default function EventManagement() {
  const [tournaments, setTournaments] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [editingTournament, setEditingTournament] = useState(null);
  const [actionConfirmation, setActionConfirmation] = useState(null);
  const [formValues, setFormValues] = useState(emptyTournamentForm());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadEventData();
  }, []);

  async function loadEventData() {
    setIsLoading(true);
    setError('');

    try {
      const [tournamentData, conditionData] = await Promise.all([
        getTournaments(),
        getTournamentConditions()
      ]);

      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setConditions(Array.isArray(conditionData) ? conditionData : []);
    } catch (err) {
      setError(err.message || 'Unable to load tournaments.');
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateForm() {
    setEditingTournament(null);
    setFormValues(emptyTournamentForm());
    setError('');
    setIsFormOpen(true);
  }
  function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

  function openEditForm(tournament) {
    setEditingTournament(tournament);

    setFormValues({
      tournamentName: tournament.tournamentName || '',
      location: tournament.location || '',
      startDate: tournament.startDate || '',
      endDate: tournament.endDate || '',
      registrationDeadline: tournament.registrationDeadline?.slice(0, 10) || '',
      minParticipants: tournament.minParticipants || 3,
      maxParticipants: tournament.maxParticipants || 1,
      conditionId: tournament.conditionId || ''
    });

    setError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (isSaving) return;

    setEditingTournament(null);
    setFormValues(emptyTournamentForm());
    setIsFormOpen(false);
    setError('');
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setFormValues((current) => ({
      ...current,
      [name]: value
    }));

    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');
if (
  formValues.registrationDeadline &&
  formValues.startDate &&
  formValues.registrationDeadline >= formValues.startDate
) {
  setError('Registration deadline must be before start date.');
  setIsSaving(false);
  return;
}
    const payload = {
      tournamentName: formValues.tournamentName.trim(),
      location: formValues.location.trim(),
      startDate: formValues.startDate,
      endDate: formValues.endDate,
      registrationDeadline: formValues.registrationDeadline,
      minParticipants: Number(formValues.minParticipants),
      maxParticipants: Number(formValues.maxParticipants),
      conditionId: Number(formValues.conditionId)
    };

    try {
      if (editingTournament) {
        await updateTournament(editingTournament.tournamentId, payload);
        setMessage('Tournament updated successfully.');
      } else {
        await createTournament(payload);
        setMessage('Tournament created successfully.');
      }

      setIsFormOpen(false);
      setEditingTournament(null);
      setFormValues(emptyTournamentForm());
      await loadEventData();
    } catch (err) {
      setError(err.message || 'Unable to save tournament.');
    } finally {
      setIsSaving(false);
    }
  }

  async function selectTournament(tournament) {
    setSelectedTournament(tournament);
    setError('');

    try {
      const data = await getTournamentRounds(tournament.tournamentId);
      setRounds(Array.isArray(data) ? data : []);
    } catch (err) {
      setRounds([]);
      setError(err.message || 'Unable to load tournament rounds.');
    }
  }

  async function handleTournamentAction(tournament, action) {
    setProcessingId(tournament.tournamentId);
    setActionConfirmation(null);
    setError('');
    setMessage('');

    try {
      if (action === 'open') {
        await openTournamentRegistration(tournament.tournamentId);
        setMessage('Tournament opened for registration.');
      } else {
        await cancelTournament(tournament.tournamentId);
        setMessage('Tournament cancelled successfully.');
      }

      setSelectedTournament(null);
      setRounds([]);
      await loadEventData();
    } catch (err) {
      setError(err.message || 'Unable to update tournament.');
    } finally {
      setProcessingId(null);
    }
  }

  function getConditionName(conditionId) {
    return conditions.find(
      (condition) => condition.conditionId === conditionId
    )?.conditionName || `Condition ${conditionId}`;
  }

  const filteredTournaments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return tournaments;

    return tournaments.filter((tournament) =>
      [
        tournament.tournamentName,
        tournament.location,
        getConditionName(tournament.conditionId),
        tournament.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [tournaments, conditions, search]);

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-brown-500">
            Admin
          </p>
          <h1 className="text-4xl font-black text-brown-900 md:text-5xl">
            Tournaments
          </h1>
          <p className="mt-3 text-slate-500">
            Create tournaments and manage their event setup.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brown-700/40 hover:bg-cream-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            type="button"
            onClick={loadEventData}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && !isFormOpen && (
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
            <h2 className="text-2xl font-bold text-brown-900">
              Tournament List
            </h2>
            <p className="mt-1 text-slate-500">
              {filteredTournaments.length} of {tournaments.length} tournaments
            </p>
          </div>

          <div className="flex items-center gap-3 max-sm:grid">
            <span className="rounded-full bg-cream-200 px-3 py-2 text-sm font-extrabold text-brown-700">
              {tournaments.filter((t) => t.status === 'Draft').length} Draft
            </span>
            <button
              className="rounded-xl border border-brown-700 bg-brown-700 px-4 py-3 font-extrabold text-white shadow-[0_8px_20px_rgba(108,63,36,0.2)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-lg"
              type="button"
              onClick={openCreateForm}
            >
              + Create Tournament
            </button>
          </div>
        </div>

        <div className="border-b border-brown-700/10 bg-cream-200/30 px-5 py-4">
          <label className="relative block w-full max-w-xl">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              size={17}
            />
            <input
              className="w-full rounded-xl border border-brown-700/15 bg-white/90 py-3 pl-10 pr-4 text-sm font-bold text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
              placeholder="Search tournament, location, condition, or status"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {isLoading ? (
          <p className="px-6 py-10 text-slate-500">
            Loading tournaments...
          </p>
        ) : tournaments.length === 0 ? (
          <div className="grid min-h-72 place-items-center content-center gap-3 px-6 text-center">
            <strong className="text-xl text-brown-900">
              No tournaments yet
            </strong>
            <span className="text-slate-500">
              Create the first tournament to begin event setup.
            </span>

            <button
              className="mt-2 rounded-xl border border-brown-700 bg-brown-700 px-4 py-3 font-extrabold text-white shadow-[0_8px_20px_rgba(108,63,36,0.2)] transition hover:-translate-y-0.5 hover:bg-brown-900 hover:shadow-lg"
              type="button"
              onClick={openCreateForm}
            >
              + Create Tournament
            </button>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="grid min-h-48 place-items-center content-center gap-2 px-6 text-center">
            <strong className="text-xl text-brown-900">
              No tournaments found
            </strong>
            <span className="text-slate-500">Try another search.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[24%]" />
              </colgroup>
              <thead className="bg-cream-200/60">
                <tr>
                  {[
                    'Tournament',
                    'Location',
                    'Schedule',
                    'Condition',
                    'Participants',
                    'Status',
                    'Actions'
                  ].map((heading) => (
                    <th
                      className="border-b border-brown-700/10 px-2 py-4 text-center text-[0.68rem] font-extrabold uppercase tracking-wide text-brown-700"
                      key={heading}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredTournaments.map((tournament) => (
                  <tr
                    className="transition hover:bg-cream-200/40"
                    key={tournament.tournamentId}
                  >
                    <td className="border-b border-brown-700/10 px-2 py-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="grid size-9 shrink-0 place-items-center rounded-lg border border-brown-700/15 bg-cream-200 text-sm font-black text-brown-700"
                          aria-hidden="true"
                        >
                          {tournament.tournamentName?.charAt(0).toUpperCase() ||
                            'T'}
                        </div>
                        <strong className="min-w-0 break-words text-[0.82rem] font-extrabold leading-snug text-brown-900">
                          {tournament.tournamentName}
                        </strong>
                      </div>
                    </td>

                    <td className="border-b border-brown-700/10 px-2 py-5">
                      <strong className="block break-words text-[0.82rem] font-extrabold leading-snug text-brown-900">
                        {tournament.location}
                      </strong>
                    </td>

                    <td className="border-b border-brown-700/10 px-2 py-5">
                      <div className="grid gap-2">
                        <div className="grid gap-0.5 rounded-lg border border-brown-700/10 bg-white/65 px-2 py-1.5 text-left shadow-sm">
                          <span className="text-[0.58rem] font-extrabold uppercase text-slate-500">
                            Start
                          </span>
                          <strong className="whitespace-nowrap text-[0.7rem] font-extrabold text-brown-900">
                            {formatDisplayDate(tournament.startDate)}
                          </strong>
                        </div>
                        <div className="grid gap-0.5 rounded-lg border border-brown-700/10 bg-white/65 px-2 py-1.5 text-left shadow-sm">
                          <span className="text-[0.58rem] font-extrabold uppercase text-slate-500">
                            End
                          </span>
                          <strong className="whitespace-nowrap text-[0.7rem] font-extrabold text-brown-900">
                            {formatDisplayDate(tournament.endDate)}
                          </strong>
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-brown-700/10 px-2 py-5 text-center">
                      <span className="inline-flex max-w-full whitespace-normal rounded-full border border-brown-500/20 bg-gold-400/10 px-2.5 py-1 text-center text-[0.7rem] font-extrabold leading-tight text-brown-700">
                        {getConditionName(tournament.conditionId)}
                      </span>
                    </td>

                    <td className="border-b border-brown-700/10 px-2 py-5 text-center">
                      <strong className="text-[0.82rem] font-extrabold text-brown-900">
                        {tournament.minParticipants}
                        <small className="px-1 font-semibold text-slate-500">
                          to
                        </small>
                        {tournament.maxParticipants}
                      </strong>
                    </td>

                    <td className="border-b border-brown-700/10 px-2 py-5 text-center">
                      <span
                        className={`inline-flex w-24 items-center justify-center rounded-xl px-2 py-2 text-center text-[0.68rem] font-extrabold leading-tight shadow-sm ${getStatusClasses(
                          tournament.status
                        )}`}
                      >
                        {formatStatus(tournament.status)}
                      </span>
                    </td>

                    <td className="border-b border-brown-700/10 px-2 py-5">
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          className="min-h-12 rounded-xl border border-brown-700/15 bg-white/90 px-2 py-2 text-xs font-extrabold leading-tight text-brown-700 shadow-[0_4px_12px_rgba(78,44,25,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-brown-700/35 hover:bg-cream-200 hover:shadow-md"
                          type="button"
                          onClick={() => selectTournament(tournament)}
                        >
                          View
                        </button>

                        <button
                          className="min-h-12 rounded-xl border border-brown-700/15 bg-white/90 px-2 py-2 text-xs font-extrabold leading-tight text-brown-700 shadow-[0_4px_12px_rgba(78,44,25,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-brown-700/35 hover:bg-cream-200 hover:shadow-md disabled:cursor-not-allowed disabled:border-brown-700/5 disabled:bg-brown-700/[0.03] disabled:text-brown-700/30 disabled:shadow-none disabled:hover:translate-y-0"
                          type="button"
                          disabled={tournament.status !== 'Draft'}
                          onClick={() => openEditForm(tournament)}
                        >
                          Edit
                        </button>

                        <button
                          className="min-h-12 whitespace-normal rounded-xl border border-green-700/20 bg-green-50 px-2 py-2 text-xs font-extrabold leading-tight text-green-700 shadow-[0_4px_12px_rgba(21,128,61,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-green-700/35 hover:bg-green-100 hover:shadow-md disabled:cursor-not-allowed disabled:border-green-700/5 disabled:bg-green-700/[0.03] disabled:text-green-700/30 disabled:shadow-none disabled:hover:translate-y-0"
                          type="button"
                          disabled={
                            tournament.status !== 'Draft' ||
                            processingId === tournament.tournamentId
                          }
                          onClick={() =>
                            setActionConfirmation({
                              tournament,
                              action: 'open'
                            })
                          }
                        >
                          Open Registration
                        </button>

                        <button
                          className="min-h-12 rounded-xl border border-danger/20 bg-danger-bg px-2 py-2 text-xs font-extrabold leading-tight text-danger shadow-[0_4px_12px_rgba(194,65,53,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-danger/35 hover:bg-red-100 hover:shadow-md disabled:cursor-not-allowed disabled:border-danger/5 disabled:bg-danger/[0.03] disabled:text-danger/30 disabled:shadow-none disabled:hover:translate-y-0"
                          type="button"
                          disabled={
                            tournament.status !== 'Draft' ||
                            processingId === tournament.tournamentId
                          }
                          onClick={() =>
                            setActionConfirmation({
                              tournament,
                              action: 'cancel'
                            })
                          }
                        >
                          Cancel
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

      {selectedTournament && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-5 backdrop-blur-sm max-sm:p-3"
          onClick={() => {
            setSelectedTournament(null);
            setRounds([]);
          }}
        >
          <section
            className="grid h-[calc(100vh-40px)] w-[calc(100vw-40px)] max-w-[1500px] grid-rows-[auto_auto_minmax(0,1fr)] overflow-hidden rounded-xl border border-brown-700/20 bg-cream-100 p-6 shadow-2xl max-sm:block max-sm:h-auto max-sm:max-h-[calc(100vh-24px)] max-sm:w-full max-sm:overflow-y-auto max-sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tournament-view-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase text-brown-500">
                  Tournament #{selectedTournament.tournamentId}
                </span>
                <h2
                  className="mt-1 text-2xl font-extrabold text-brown-900"
                  id="tournament-view-title"
                >
                  {selectedTournament.tournamentName}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Review tournament information and its fixed round structure.
                </p>
              </div>

              <button
                className="grid size-9 shrink-0 place-items-center rounded-full border border-brown-700/20 bg-white/70 text-xl text-slate-500 transition hover:bg-cream-200"
                type="button"
                aria-label="Close tournament details"
                onClick={() => {
                  setSelectedTournament(null);
                  setRounds([]);
                }}
              >
                ×
              </button>
            </div>

            <dl className="mb-4 grid grid-cols-2 overflow-hidden rounded-lg border border-brown-700/10 bg-brown-700/10 lg:grid-cols-6 max-sm:grid-cols-1">
              <div className="min-w-0 bg-white/70 px-3 py-3">
                <dt className="mb-1 text-xs font-extrabold uppercase text-slate-500">
                  Location
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {selectedTournament.location}
                </dd>
              </div>
              <div className="min-w-0 border-l border-brown-700/10 bg-white/70 px-3 py-3 max-sm:border-l-0 max-sm:border-t">
                <dt className="mb-1 text-xs font-extrabold uppercase text-slate-500">
                  Status
                </dt>
                <dd className="m-0">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${getStatusClasses(
                      selectedTournament.status
                    )}`}
                  >
                    {formatStatus(selectedTournament.status)}
                  </span>
                </dd>
              </div>
              <div className="min-w-0 border-l border-brown-700/10 bg-white/70 px-3 py-3 max-sm:border-l-0 max-sm:border-t">
                <dt className="mb-1 text-xs font-extrabold uppercase text-slate-500">
                  Schedule
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {selectedTournament.startDate} to {selectedTournament.endDate}
                </dd>
              </div>
              <div className="min-w-0 border-l border-brown-700/10 bg-white/70 px-3 py-3 max-sm:border-l-0 max-sm:border-t">
                <dt className="mb-1 text-xs font-extrabold uppercase text-slate-500">
                  Registration Deadline
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {selectedTournament.registrationDeadline?.slice(0, 10) || 'N/A'}
                </dd>
              </div>
              <div className="min-w-0 border-l border-brown-700/10 bg-white/70 px-3 py-3 max-sm:border-l-0 max-sm:border-t">
                <dt className="mb-1 text-xs font-extrabold uppercase text-slate-500">
                  Condition
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {getConditionName(selectedTournament.conditionId)}
                </dd>
              </div>
              <div className="min-w-0 border-l border-brown-700/10 bg-white/70 px-3 py-3 max-sm:border-l-0 max-sm:border-t">
                <dt className="mb-1 text-xs font-extrabold uppercase text-slate-500">
                  Participants
                </dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {selectedTournament.minParticipants} - {selectedTournament.maxParticipants}
                </dd>
              </div>
            </dl>

            <RaceManagement
              tournament={selectedTournament}
              rounds={rounds}
            />
          </section>
        </div>
      )}

      {isFormOpen && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm max-sm:items-end max-sm:p-3"
          onClick={closeForm}
        >
          <form
            className="max-h-[calc(100vh-48px)] w-full max-w-3xl overflow-y-auto rounded-xl border border-brown-700/20 bg-cream-100 p-7 shadow-2xl max-sm:max-h-[calc(100vh-24px)] max-sm:p-5"
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase text-brown-500">
                  {editingTournament ? 'Draft Tournament' : 'New Tournament'}
                </span>

                <h2 className="mt-1 text-2xl font-extrabold text-brown-900">
                  {editingTournament
                    ? 'Edit Tournament'
                    : 'Create Tournament'}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Qualified, Semi-Final, and Final rounds are created
                  automatically.
                </p>
              </div>

              <button
                className="grid size-9 shrink-0 place-items-center rounded-full border border-brown-700/20 bg-white/70 text-xl text-slate-500 transition hover:bg-cream-200"
                type="button"
                aria-label="Close form"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-danger">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-brown-900">
                <span>Tournament Name</span>
                <input
                  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  name="tournamentName"
                  value={formValues.tournamentName}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900">
                <span>Location</span>
                <input
                  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  name="location"
                  value={formValues.location}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900 sm:col-span-2">
                <span>Condition</span>
                <select
                  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  name="conditionId"
                  value={formValues.conditionId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select condition</option>

                  {conditions.map((condition) => (
                    <option
                      key={condition.conditionId}
                      value={condition.conditionId}
                    >
                      {condition.conditionName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900">
                <span>Start Date</span>
                <input
  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
  name="startDate"
  type="date"
  min={getTomorrowDate()}
  value={formValues.startDate}
  onChange={handleChange}
  required
/>
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900">
                <span>End Date</span>
                <input
                  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  name="endDate"
                  type="date"
                  value={formValues.endDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900 sm:col-span-2">
                <span>Registration Deadline</span>
                <input
  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
  name="registrationDeadline"
  type="date"
  max={formValues.startDate || undefined}
  value={formValues.registrationDeadline}
  onChange={handleChange}
  required
/>
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900">
                <span>Minimum Participants</span>
                <input
  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
  name="minParticipants"
  type="number"
  min="3"
  value={formValues.minParticipants}
  onChange={handleChange}
  required
/>
              </label>

              <label className="grid gap-2 text-sm font-bold text-brown-900">
                <span>Maximum Participants</span>
                <input
                  className="w-full rounded-lg border border-brown-700/20 bg-white/80 px-4 py-3 text-brown-900 outline-none transition focus:border-brown-500 focus:ring-4 focus:ring-gold-400/20"
                  name="maxParticipants"
                  type="number"
                  min="1"
                  value={formValues.maxParticipants}
                  onChange={handleChange}
                  required
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3 max-sm:grid max-sm:grid-cols-1">
              <button
                className="rounded-lg border border-brown-700/20 bg-white/70 px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={closeForm}
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                className="rounded-lg border border-brown-700 bg-brown-700 px-4 py-3 font-extrabold text-white transition hover:bg-brown-900 disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? 'Saving...'
                  : editingTournament
                    ? 'Save Changes'
                    : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>
      )}

      {actionConfirmation && (
        <div
          className="fixed inset-0 z-[1000] grid place-items-center bg-brown-900/60 p-6 backdrop-blur-sm max-sm:items-end max-sm:p-3"
          onClick={() => setActionConfirmation(null)}
        >
          <div
            className={`relative w-full max-w-lg overflow-hidden rounded-lg border border-brown-700/20 bg-cream-100 p-7 shadow-2xl before:absolute before:inset-x-0 before:top-0 before:h-1 max-sm:p-5 ${
              actionConfirmation.action === 'cancel'
                ? 'before:bg-danger'
                : 'before:bg-green-700'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-4">
              <span
                className={`grid size-12 shrink-0 place-items-center rounded-full text-xl font-black ${
                  actionConfirmation.action === 'cancel'
                    ? 'bg-danger-bg text-danger'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {actionConfirmation.action === 'open' ? '✓' : '!'}
              </span>

              <div>
                <span className="mb-1 block text-xs font-extrabold uppercase text-slate-500">
                  Tournament #{actionConfirmation.tournament.tournamentId}
                </span>

                <h2 className="text-xl font-extrabold text-brown-900">
                  {actionConfirmation.action === 'open'
                    ? 'Open Registration'
                    : 'Cancel Tournament'}
                </h2>
              </div>
            </div>

            <p className="my-5 leading-relaxed text-slate-500">
              {actionConfirmation.action === 'open'
                ? 'After registration opens, this tournament can no longer be edited or cancelled.'
                : 'The tournament, rounds, and races will be marked as cancelled.'}
            </p>

            <dl className="grid overflow-hidden rounded-lg border border-brown-700/10 bg-brown-700/10">
              <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Tournament</dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {actionConfirmation.tournament.tournamentName}
                </dd>
              </div>

              <div className="mt-px grid grid-cols-[7rem_minmax(0,1fr)] gap-4 bg-white/70 px-4 py-3 max-sm:grid-cols-1 max-sm:gap-1">
                <dt className="text-sm font-bold text-slate-500">Location</dt>
                <dd className="m-0 break-words text-sm font-extrabold text-brown-900">
                  {actionConfirmation.tournament.location}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-3 max-sm:grid max-sm:grid-cols-1">
              <button
                className="rounded-lg border border-brown-700/20 bg-white/70 px-4 py-3 font-extrabold text-brown-700 transition hover:bg-cream-200"
                type="button"
                onClick={() => setActionConfirmation(null)}
              >
                Go Back
              </button>

              <button
                className={`rounded-lg border px-4 py-3 font-extrabold text-white transition ${
                  actionConfirmation.action === 'cancel'
                    ? 'border-danger bg-danger hover:bg-red-700'
                    : 'border-green-700 bg-green-700 hover:bg-green-800'
                }`}
                type="button"
                onClick={() =>
                  handleTournamentAction(
                    actionConfirmation.tournament,
                    actionConfirmation.action
                  )
                }
              >
                {actionConfirmation.action === 'open'
                  ? 'Open Registration'
                  : 'Cancel Tournament'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
