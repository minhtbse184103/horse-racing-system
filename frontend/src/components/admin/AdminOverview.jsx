import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Gavel,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users
} from 'lucide-react';
import { getPendingHorses } from '../../services/adminHorseReviewService';
import { getJockeyProfilesUnderReview } from '../../services/adminProfileReviewService';
import {
  getAcceptedRegistrations,
  getRegistrationHistory
} from '../../services/adminRegistrationService';
import { getTournaments } from '../../services/eventService';
import { getRaceEntryAssignmentQueue } from '../../services/raceEntryService';
import { getRefereeAssignments } from '../../services/refereeAssignmentService';
import { getUsers } from '../../services/userService';

const STATUS_STYLES = {
  Draft: 'bg-amber-100 text-amber-800',
  OpenForRegistration: 'bg-green-100 text-green-800',
  ClosedRegistration: 'bg-stone-200 text-stone-700',
  Ongoing: 'bg-blue-100 text-blue-800',
  Finished: 'bg-emerald-100 text-emerald-800',
  Cancelled: 'bg-red-100 text-red-700'
};

function formatStatus(status) {
  return String(status || 'Unknown')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ');
}

function formatDate(value) {
  if (!value) return 'Date unavailable';

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function MetricCard({ icon: Icon, label, value, note, tone, onClick }) {
  const tones = {
    brown: 'bg-brown-700 text-white',
    green: 'bg-green-700 text-white',
    gold: 'bg-gold-400 text-brown-900',
    cream: 'bg-cream-200 text-brown-700'
  };

  return (
    <button
      className="group rounded-lg border border-brown-700/10 bg-cream-100 p-5 text-left shadow-[0_14px_35px_rgba(78,44,25,0.1)] transition hover:-translate-y-0.5 hover:border-brown-700/25 hover:shadow-lg"
      type="button"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-11 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={21} strokeWidth={2.4} />
        </span>
        <ArrowRight
          className="text-brown-500 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
          size={18}
        />
      </div>

      <p className="mt-5 text-xs font-extrabold uppercase text-slate-500">
        {label}
      </p>
      <strong className="mt-1 block text-3xl font-black text-brown-900">
        {value}
      </strong>
      <span className="mt-2 block text-xs font-semibold text-slate-500">
        {note}
      </span>
    </button>
  );
}

function WorkQueueCard({ icon: Icon, label, count, note, tone, onClick }) {
  return (
    <button
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-brown-700/10 bg-white/75 p-4 text-left transition hover:border-brown-700/25 hover:bg-white hover:shadow-md"
      type="button"
      onClick={onClick}
    >
      <span className={`grid size-11 place-items-center rounded-lg ${tone}`}>
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <strong className="block font-extrabold text-brown-900">{label}</strong>
        <small className="mt-1 block truncate text-xs font-semibold text-slate-500">
          {note}
        </small>
      </span>
      <span className="grid size-9 place-items-center rounded-full bg-cream-200 text-sm font-black text-brown-700">
        {count}
      </span>
    </button>
  );
}

export default function AdminOverview({ onNavigate }) {
  const [data, setData] = useState({
    users: [],
    tournaments: [],
    pendingRegistrations: [],
    registrationHistory: [],
    pendingHorses: [],
    pendingJockeys: [],
    raceEntryQueue: [],
    refereeAssignments: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    setIsLoading(true);
    setError('');

    try {
      const [
        users,
        tournaments,
        pendingRegistrations,
        registrationHistory,
        pendingHorses,
        pendingJockeys,
        raceEntryQueue,
        refereeAssignments
      ] = await Promise.all([
        getUsers(),
        getTournaments(),
        getAcceptedRegistrations(),
        getRegistrationHistory(),
        getPendingHorses(),
        getJockeyProfilesUnderReview(),
        getRaceEntryAssignmentQueue(),
        getRefereeAssignments()
      ]);

      setData({
        users: Array.isArray(users) ? users : [],
        tournaments: Array.isArray(tournaments) ? tournaments : [],
        pendingRegistrations: Array.isArray(pendingRegistrations)
          ? pendingRegistrations
          : [],
        registrationHistory: Array.isArray(registrationHistory)
          ? registrationHistory
          : [],
        pendingHorses: Array.isArray(pendingHorses) ? pendingHorses : [],
        pendingJockeys: Array.isArray(pendingJockeys) ? pendingJockeys : [],
        raceEntryQueue: Array.isArray(raceEntryQueue) ? raceEntryQueue : [],
        refereeAssignments: Array.isArray(refereeAssignments)
          ? refereeAssignments
          : []
      });
    } catch (err) {
      setError(err.message || 'Unable to load dashboard overview.');
    } finally {
      setIsLoading(false);
    }
  }

  const confirmedRegistrations = data.registrationHistory.filter(
    (registration) => registration.status === 'CONFIRMED'
  ).length;
  const activeUsers = data.users.filter((user) => user.status === 'ACTIVE').length;
  const openTournaments = data.tournaments.filter(
    (tournament) => tournament.status === 'OpenForRegistration'
  ).length;
  const totalReviewQueue =
    data.pendingRegistrations.length +
    data.pendingHorses.length +
    data.pendingJockeys.length;

  const upcomingTournaments = useMemo(
    () =>
      [...data.tournaments]
        .filter((tournament) => tournament.status !== 'Cancelled')
        .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
        .slice(0, 5),
    [data.tournaments]
  );

  const tournamentStatuses = useMemo(() => {
    const statuses = [
      'Draft',
      'OpenForRegistration',
      'ClosedRegistration',
      'Ongoing',
      'Finished',
      'Cancelled'
    ];

    return statuses.map((status) => ({
      status,
      count: data.tournaments.filter((tournament) => tournament.status === status)
        .length
    }));
  }, [data.tournaments]);

  const workQueues = [
    {
      key: 'registrations',
      label: 'Registration Reviews',
      count: data.pendingRegistrations.length,
      note: 'Accepted jockey invitations awaiting admin decision',
      icon: UserCheck,
      tone: 'bg-blue-100 text-blue-700'
    },
    {
      key: 'horseReviews',
      label: 'Horse Reviews',
      count: data.pendingHorses.length,
      note: 'Pending horse profiles and health certificates',
      icon: ShieldCheck,
      tone: 'bg-green-100 text-green-700'
    },
    {
      key: 'jockeyReviews',
      label: 'Jockey Reviews',
      count: data.pendingJockeys.length,
      note: 'Jockey profiles awaiting approval',
      icon: ClipboardCheck,
      tone: 'bg-amber-100 text-amber-700'
    },
    {
      key: 'raceEntries',
      label: 'Race Entry Queue',
      count: data.raceEntryQueue.length,
      note: 'Confirmed registrations waiting for a race',
      icon: Flag,
      tone: 'bg-purple-100 text-purple-700'
    }
  ];

  const quickActions = [
    {
      key: 'events',
      label: 'Tournament Setup',
      note: 'Create tournaments, rounds, and races',
      icon: Trophy
    },
    {
      key: 'refereeAssignments',
      label: 'Referee Assignments',
      note: `${data.refereeAssignments.length} races currently covered`,
      icon: Gavel
    },
    {
      key: 'users',
      label: 'User Management',
      note: `${activeUsers} active accounts`,
      icon: Users
    }
  ];

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-widest text-brown-500">
            Admin Command Center
          </p>
          <h1 className="mt-2 text-4xl font-black md:text-5xl">
            Pre-Race Operations
          </h1>
          <p className="mt-3 max-w-2xl font-medium text-slate-500">
            Review participants, prepare race fields, and make sure every event
            is ready before tournament operations begin.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:bg-cream-100 disabled:opacity-60"
          type="button"
          onClick={loadOverview}
          disabled={isLoading}
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Trophy}
          label="Open Tournaments"
          value={openTournaments}
          note={`${data.tournaments.length} tournaments total`}
          tone="brown"
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Pending Reviews"
          value={totalReviewQueue}
          note="Across registrations, horses, and jockeys"
          tone="gold"
          onClick={() => onNavigate('registrations')}
        />
        <MetricCard
          icon={Flag}
          label="Awaiting Race Entry"
          value={data.raceEntryQueue.length}
          note={`${confirmedRegistrations} confirmed registrations`}
          tone="green"
          onClick={() => onNavigate('raceEntries')}
        />
        <MetricCard
          icon={Gavel}
          label="Referees Assigned"
          value={data.refereeAssignments.length}
          note="Races with active referee coverage"
          tone="cream"
          onClick={() => onNavigate('refereeAssignments')}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">
                Action Required
              </span>
              <h2 className="mt-1 text-2xl font-black">Admin work queues</h2>
            </div>
            <span className="rounded-full bg-danger-bg px-3 py-1 text-sm font-black text-danger">
              {totalReviewQueue + data.raceEntryQueue.length} waiting
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {workQueues.map((queue) => (
              <WorkQueueCard
                key={queue.key}
                {...queue}
                onClick={() => onNavigate(queue.key)}
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-brown-700/10 bg-brown-900 p-5 text-white shadow-[0_18px_45px_rgba(43,23,16,0.22)]">
          <span className="text-xs font-extrabold uppercase text-gold-400">
            Quick Operations
          </span>
          <h2 className="mt-1 text-2xl font-black">Continue setup</h2>

          <div className="mt-5 grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:bg-white/15"
                  key={action.key}
                  type="button"
                  onClick={() => onNavigate(action.key)}
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-white/10 text-gold-400">
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <strong className="block font-extrabold">{action.label}</strong>
                    <small className="mt-1 block truncate text-xs font-semibold text-white/60">
                      {action.note}
                    </small>
                  </span>
                  <ArrowRight
                    className="text-white/60 transition group-hover:translate-x-0.5"
                    size={18}
                  />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.82fr]">
        <section className="overflow-hidden rounded-lg border border-brown-700/10 bg-cream-100 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/45 px-5 py-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">
                Calendar
              </span>
              <h2 className="mt-1 text-xl font-black">Upcoming tournaments</h2>
            </div>
            <CalendarDays size={22} className="text-brown-500" />
          </div>

          <div className="divide-y divide-brown-700/10">
            {upcomingTournaments.length === 0 ? (
              <p className="px-5 py-8 text-slate-500">No upcoming tournaments.</p>
            ) : (
              upcomingTournaments.map((tournament) => (
                <button
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 text-left transition hover:bg-cream-200/40"
                  key={tournament.tournamentId}
                  type="button"
                  onClick={() => onNavigate('events')}
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-cream-200 font-black text-brown-700">
                    {tournament.tournamentName?.charAt(0) || 'T'}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-extrabold">
                      {tournament.tournamentName}
                    </strong>
                    <small className="mt-1 block truncate font-semibold text-slate-500">
                      {tournament.location}
                    </small>
                  </span>
                  <span className="text-right">
                    <time className="block text-xs font-extrabold text-brown-700">
                      {formatDate(tournament.startDate)}
                    </time>
                    <small
                      className={`mt-1 inline-flex rounded-full px-2 py-1 text-[0.68rem] font-extrabold ${
                        STATUS_STYLES[tournament.status] ||
                        'bg-cream-200 text-brown-700'
                      }`}
                    >
                      {formatStatus(tournament.status)}
                    </small>
                  </span>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="rounded-lg border border-brown-700/10 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <span className="text-xs font-extrabold uppercase text-brown-500">
            Tournament Lifecycle
          </span>
          <h2 className="mt-1 text-xl font-black">Events by status</h2>

          <div className="mt-5 grid gap-3">
            {tournamentStatuses.map(({ status, count }) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                key={status}
              >
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-3 text-sm font-extrabold">
                    <span>{formatStatus(status)}</span>
                    <span>{count}</span>
                  </span>
                  <span className="mt-2 block h-2 overflow-hidden rounded-full bg-cream-200">
                    <span
                      className="block h-full rounded-full bg-brown-700"
                      style={{
                        width: `${
                          data.tournaments.length
                            ? Math.max((count / data.tournaments.length) * 100, count ? 8 : 0)
                            : 0
                        }%`
                      }}
                    />
                  </span>
                </span>
                {count > 0 ? (
                  <CheckCircle2 size={18} className="text-green-700" />
                ) : (
                  <span className="size-[18px]" />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
