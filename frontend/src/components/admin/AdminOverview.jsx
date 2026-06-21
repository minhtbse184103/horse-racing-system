import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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
import { formatDisplayLabel } from '../../lib';
import { getPendingHorses } from '../../services/adminHorseReviewService';
import { getJockeyProfilesUnderReview } from '../../services/adminProfileReviewService';
import {
  getPendingRegistrations,
  getRegistrationHistory
} from '../../services/adminRegistrationService';
import { getTournaments } from '../../services/eventService';
import { getAssignmentQueue } from '../../services/raceEntryService';
import { getRefereeAssignments } from '../../services/refereeAssignmentService';
import { getUsers } from '../../services/userService';
import {
  fadeSlideItem,
  hoverLift,
  pageTransition,
  staggerContainer,
  tapPress
} from './ui/motion';

const STATUS_STYLES = {
  OPEN_FOR_REGISTRATION: 'bg-green-100 text-green-800',
  REGISTRATION_CLOSED: 'bg-stone-200 text-stone-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-700'
};

function formatStatus(status) {
  return formatDisplayLabel(status);
}

function formatDate(value) {
  if (!value) return 'Chưa có ngày';

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
    <motion.button
      variants={fadeSlideItem}
      whileHover={hoverLift}
      whileTap={tapPress}
      className="group relative overflow-hidden rounded-lg border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(255,248,238,0.9))] p-5 text-left shadow-[0_12px_32px_rgba(78,44,25,0.09),0_1px_2px_rgba(43,23,16,0.08)] transition-colors hover:border-gold-400/45 hover:shadow-[0_20px_46px_rgba(78,44,25,0.14)]"
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
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gold-400 transition-transform duration-300 group-hover:scale-x-100" />
    </motion.button>
  );
}

function WorkQueueCard({ icon: Icon, label, count, note, tone, onClick }) {
  return (
    <motion.button
      whileHover={{ x: 3, transition: { duration: 0.16 } }}
      whileTap={tapPress}
      className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-lg border border-brown-700/10 bg-white/80 p-4 text-left shadow-[0_5px_16px_rgba(78,44,25,0.05)] transition-colors hover:border-gold-400/45 hover:bg-white hover:shadow-[0_12px_28px_rgba(78,44,25,0.1)]"
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
    </motion.button>
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
        getPendingRegistrations(),
        getRegistrationHistory(),
        getPendingHorses(),
        getJockeyProfilesUnderReview(),
        getAssignmentQueue(),
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
      setError(err.message || 'Không thể tải dữ liệu tổng quan.');
    } finally {
      setIsLoading(false);
    }
  }

  const approvedRegistrations = data.registrationHistory.filter(
    (registration) => registration.approvalStatus === 'APPROVED'
  ).length;
  const activeUsers = data.users.filter((user) => user.status === 'ACTIVE').length;
  const openTournaments = data.tournaments.filter(
    (tournament) => tournament.status === 'OPEN_FOR_REGISTRATION'
  ).length;
  const totalReviewQueue =
    data.pendingRegistrations.length +
    data.pendingHorses.length +
    data.pendingJockeys.length;

  const upcomingTournaments = useMemo(
    () =>
      [...data.tournaments]
        .filter((tournament) => tournament.status !== 'CANCELLED')
        .sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)))
        .slice(0, 5),
    [data.tournaments]
  );

  const tournamentStatuses = useMemo(() => {
    const statuses = [
      'OPEN_FOR_REGISTRATION',
      'REGISTRATION_CLOSED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
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
      target: 'events',
      label: 'Duyệt đơn đăng ký',
      count: data.pendingRegistrations.length,
      note: 'Lời mời jockey đã chấp nhận đang chờ admin quyết định',
      icon: UserCheck,
      tone: 'bg-blue-100 text-blue-700'
    },
    {
      key: 'horseReviews',
      label: 'Duyệt ngựa',
      count: data.pendingHorses.length,
      note: 'Hồ sơ ngựa và chứng nhận sức khỏe đang chờ duyệt',
      icon: ShieldCheck,
      tone: 'bg-green-100 text-green-700'
    },
    {
      key: 'jockeyReviews',
      label: 'Duyệt jockey',
      count: data.pendingJockeys.length,
      note: 'Hồ sơ jockey đang chờ phê duyệt',
      icon: ClipboardCheck,
      tone: 'bg-amber-100 text-amber-700'
    },
    {
      key: 'raceEntries',
      target: 'events',
      label: 'Hàng chờ xếp cuộc đua',
      count: data.raceEntryQueue.length,
      note: 'Đơn đăng ký đã xác nhận đang chờ xếp cuộc đua',
      icon: Flag,
      tone: 'bg-purple-100 text-purple-700'
    }
  ];

  const quickActions = [
    {
      key: 'events',
      label: 'Thiết lập giải đấu',
      note: 'Tạo giải đấu và các cuộc đua trực thuộc',
      icon: Trophy
    },
    {
      key: 'refereeAssignments',
      label: 'Phân công referee',
      note: `${data.refereeAssignments.length} races currently covered`,
      icon: Gavel
    },
    {
      key: 'users',
      label: 'Quản lý người dùng',
      note: `${activeUsers} active accounts`,
      icon: Users
    }
  ];

  return (
    <motion.section {...pageTransition} className="space-y-6 text-brown-900">
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

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          icon={Trophy}
          label="Giải đấu đang mở"
          value={openTournaments}
          note={`${data.tournaments.length} tournaments total`}
          tone="brown"
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Hồ sơ đang chờ xét duyệt"
          value={totalReviewQueue}
          note="Tổng hợp đơn đăng ký, ngựa và jockey"
          tone="gold"
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={Flag}
          label="Đang chờ xếp cuộc đua"
          value={data.raceEntryQueue.length}
          note={`${approvedRegistrations} approved registrations`}
          tone="green"
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={Gavel}
          label="Referee đã phân công"
          value={data.refereeAssignments.length}
          note="Cuộc đua đã có referee phụ trách"
          tone="cream"
          onClick={() => onNavigate('refereeAssignments')}
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.section whileHover={{ y: -2 }} className="rounded-lg border border-white/75 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1),0_1px_2px_rgba(43,23,16,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">
                Action Required
              </span>
              <h2 className="mt-1 text-2xl font-black">Hàng chờ công việc quản trị</h2>
            </div>
            <span className="rounded-full bg-danger-bg px-3 py-1 text-sm font-black text-danger">
              {totalReviewQueue + data.raceEntryQueue.length} waiting
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {workQueues.map(({ key, ...queue }) => (
              <WorkQueueCard
                key={key}
                {...queue}
                onClick={() => onNavigate(queue.target || key)}
              />
            ))}
          </div>
        </motion.section>

        <motion.section whileHover={{ y: -2 }} className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,#2b1710,#4a2819)] p-5 text-white shadow-[0_22px_52px_rgba(43,23,16,0.25)]">
          <span className="text-xs font-extrabold uppercase text-gold-400">
            Quick Operations
          </span>
          <h2 className="mt-1 text-2xl font-black">Tiếp tục thiết lập</h2>

          <div className="mt-5 grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <motion.button
                  whileHover={{ x: 3 }}
                  whileTap={tapPress}
                  className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.08] px-4 py-3 text-left shadow-sm transition-colors hover:border-gold-400/35 hover:bg-white/[0.14]"
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
                </motion.button>
              );
            })}
          </div>
          <span className="pointer-events-none absolute -right-10 -top-16 size-40 rounded-full border border-white/10" />
        </motion.section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_0.82fr]">
        <motion.section whileHover={{ y: -2 }} className="overflow-hidden rounded-lg border border-white/75 bg-cream-100 shadow-[0_18px_45px_rgba(78,44,25,0.1),0_1px_2px_rgba(43,23,16,0.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/45 px-5 py-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">
                Calendar
              </span>
              <h2 className="mt-1 text-xl font-black">Giải đấu sắp diễn ra</h2>
            </div>
            <CalendarDays size={22} className="text-brown-500" />
          </div>

          <div className="divide-y divide-brown-700/10">
            {upcomingTournaments.length === 0 ? (
              <div className="grid min-h-40 place-items-center px-5 py-8 text-center">
                <div>
                  <span className="mx-auto grid size-11 place-items-center rounded-lg bg-cream-200 text-brown-500"><CalendarDays size={20} /></span>
                  <p className="mt-3 font-extrabold text-brown-900">Chưa có giải đấu sắp diễn ra</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Các giải đấu sắp tới sẽ xuất hiện tại đây.</p>
                </div>
              </div>
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
                      {tournament.venue}
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
        </motion.section>

        <motion.section whileHover={{ y: -2 }} className="rounded-lg border border-white/75 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1),0_1px_2px_rgba(43,23,16,0.08)]">
          <span className="text-xs font-extrabold uppercase text-brown-500">
            Tournament Lifecycle
          </span>
          <h2 className="mt-1 text-xl font-black">Giải đấu theo trạng thái</h2>

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
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          data.tournaments.length
                            ? Math.max((count / data.tournaments.length) * 100, count ? 8 : 0)
                            : 0
                        }%`
                      }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className="block h-full rounded-full bg-brown-700"
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
        </motion.section>
      </div>
    </motion.section>
  );
}
