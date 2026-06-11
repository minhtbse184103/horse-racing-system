import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flag,
  RefreshCw,
  Trophy,
  Users
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  getAcceptedRegistrations,
  getRegistrationHistory
} from '../../services/adminRegistrationService';
import { getTournaments } from '../../services/eventService';
import { getUsers } from '../../services/userService';

const STATUS_COLORS = {
  Draft: '#d9a441',
  OpenForRegistration: '#4f9b6d',
  ClosedRegistration: '#8b6a55',
  Ongoing: '#a76635',
  Finished: '#2e7d32',
  Cancelled: '#c24135'
};

function formatStatus(status) {
  return String(status || 'Unknown').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function formatDate(value) {
  if (!value) return 'Date unavailable';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function MetricCard({ icon: Icon, label, value, note, tone }) {
  const tones = {
    brown: 'bg-brown-700 text-white',
    green: 'bg-green-700 text-white',
    gold: 'bg-gold-400 text-brown-900',
    cream: 'bg-cream-200 text-brown-700'
  };

  return (
    <article className="rounded-xl border border-brown-700/10 bg-cream-100/90 p-5 shadow-[0_14px_35px_rgba(78,44,25,0.1)]">
      <div className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon size={21} strokeWidth={2.4} />
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
    </article>
  );
}

export default function AdminOverview({ onNavigate }) {
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    setIsLoading(true);
    setError('');

    try {
      const [userData, tournamentData, pendingData, historyData] =
        await Promise.all([
          getUsers(),
          getTournaments(),
          getAcceptedRegistrations(),
          getRegistrationHistory()
        ]);

      setUsers(Array.isArray(userData) ? userData : []);
      setTournaments(Array.isArray(tournamentData) ? tournamentData : []);
      setPending(Array.isArray(pendingData) ? pendingData : []);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (err) {
      setError(err.message || 'Unable to load dashboard overview.');
    } finally {
      setIsLoading(false);
    }
  }

  const tournamentStatusData = useMemo(() => {
    const counts = tournaments.reduce((result, tournament) => {
      result[tournament.status] = (result[tournament.status] || 0) + 1;
      return result;
    }, {});

    return Object.entries(counts).map(([status, value]) => ({
      name: formatStatus(status),
      status,
      value
    }));
  }, [tournaments]);

  const userRoleData = useMemo(() => {
    const counts = users.reduce((result, user) => {
      const role = user.role || 'Unknown';
      result[role] = (result[role] || 0) + 1;
      return result;
    }, {});

    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  }, [users]);

  const confirmedCount = history.filter(
    (registration) => registration.status === 'CONFIRMED'
  ).length;
  const activeTournaments = tournaments.filter((tournament) =>
    ['OpenForRegistration', 'ClosedRegistration', 'Ongoing'].includes(
      tournament.status
    )
  ).length;
  const upcomingTournaments = [...tournaments]
    .filter((tournament) => tournament.status !== 'Cancelled')
    .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
    .slice(0, 4);

  return (
    <section className="space-y-6 text-brown-900">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-widest text-brown-500">
            Admin Overview
          </p>
          <h1 className="text-4xl font-black text-brown-900 md:text-5xl">
            Racing Operations
          </h1>
          <p className="mt-3 text-slate-500">
            Monitor tournaments, registrations, and system activity.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-brown-700/15 bg-white/90 px-4 py-3 font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cream-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          type="button"
          onClick={loadOverview}
          disabled={isLoading}
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger-bg px-4 py-3 font-bold text-danger">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Trophy}
          label="Tournaments"
          value={tournaments.length}
          note={`${activeTournaments} currently active`}
          tone="brown"
        />
        <MetricCard
          icon={Clock3}
          label="Pending Review"
          value={pending.length}
          note="Awaiting admin decision"
          tone="gold"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Confirmed"
          value={confirmedCount}
          note="Eligible for race assignment"
          tone="green"
        />
        <MetricCard
          icon={Users}
          label="System Users"
          value={users.length}
          note={`${users.filter((user) => user.status === 'ACTIVE').length} active accounts`}
          tone="cream"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-xl border border-brown-700/10 bg-cream-100/90 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <div>
            <span className="text-xs font-extrabold uppercase text-brown-500">
              Tournament Pipeline
            </span>
            <h2 className="mt-1 text-xl font-extrabold text-brown-900">
              Events by status
            </h2>
          </div>

          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tournamentStatusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={94}
                  paddingAngle={4}
                >
                  {tournamentStatusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] || '#657083'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {tournamentStatusData.map((entry) => (
              <span
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500"
                key={entry.status}
              >
                <i
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor: STATUS_COLORS[entry.status] || '#657083'
                  }}
                />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-brown-700/10 bg-cream-100/90 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <span className="text-xs font-extrabold uppercase text-brown-500">
            Account Distribution
          </span>
          <h2 className="mt-1 text-xl font-extrabold text-brown-900">
            Users by role
          </h2>

          <div className="mt-5 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRoleData} layout="vertical">
                <CartesianGrid stroke="#eadac7" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="role"
                  width={78}
                  tick={{ fill: '#6c3f24', fontSize: 11, fontWeight: 800 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#6c3f24" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.72fr]">
        <section className="overflow-hidden rounded-xl border border-brown-700/10 bg-cream-100/90 shadow-[0_18px_45px_rgba(78,44,25,0.1)]">
          <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/45 px-5 py-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">
                Schedule
              </span>
              <h2 className="mt-1 text-xl font-extrabold text-brown-900">
                Upcoming tournaments
              </h2>
            </div>
            <CalendarDays size={22} className="text-brown-500" />
          </div>

          <div className="divide-y divide-brown-700/10">
            {upcomingTournaments.length === 0 ? (
              <p className="px-5 py-8 text-slate-500">
                No upcoming tournaments.
              </p>
            ) : (
              upcomingTournaments.map((tournament) => (
                <article
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition hover:bg-cream-200/40"
                  key={tournament.tournamentId}
                >
                  <div className="grid size-10 place-items-center rounded-xl bg-cream-200 font-black text-brown-700">
                    {tournament.tournamentName?.charAt(0) || 'T'}
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-[0.82rem] font-extrabold text-brown-900">
                      {tournament.tournamentName}
                    </strong>
                    <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
                      {tournament.location}
                    </span>
                  </div>
                  <time className="text-xs font-extrabold text-brown-700">
                    {formatDate(tournament.startDate)}
                  </time>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-brown-700/10 bg-brown-900 p-5 text-white shadow-[0_18px_45px_rgba(43,23,16,0.22)]">
          <span className="text-xs font-extrabold uppercase text-gold-400">
            Quick Actions
          </span>
          <h2 className="mt-1 text-xl font-extrabold">Continue operations</h2>

          <div className="mt-5 grid gap-3">
            {[
              {
                key: 'events',
                label: 'Manage tournaments',
                note: 'Create events and configure races',
                icon: Trophy
              },
              {
                key: 'registrations',
                label: 'Review registrations',
                note: `${pending.length} waiting for review`,
                icon: CheckCircle2
              },
              {
                key: 'raceEntries',
                label: 'Assign race entries',
                note: 'Place confirmed runners into races',
                icon: Flag
              }
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:bg-white/15"
                  key={action.key}
                  type="button"
                  onClick={() => onNavigate(action.key)}
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-white/10 text-gold-400">
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0">
                    <strong className="block font-extrabold">
                      {action.label}
                    </strong>
                    <small className="mt-1 block text-xs font-semibold text-white/60">
                      {action.note}
                    </small>
                  </span>
                  <ArrowRight size={18} className="text-white/60" />
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
