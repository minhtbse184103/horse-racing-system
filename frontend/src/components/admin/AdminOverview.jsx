import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Activity,
  ArrowRight,
  CalendarDays,
  ChevronRight,
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

const STATUS_LABELS = {
  OPEN_FOR_REGISTRATION: 'Đang mở đăng ký',
  REGISTRATION_CLOSED: 'Đã đóng đăng ký',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy'
};

function formatStatus(status) {
  return STATUS_LABELS[status] || formatDisplayLabel(status);
}

function formatDate(value) {
  if (!value) return 'Chưa có ngày';

  return new Date(`${value}T00:00:00`).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function OverviewLoadingRows() {
  return (
    <div className="divide-y divide-brown-700/10" aria-label="Đang tải giải đấu">
      {[1, 2, 3].map((item) => (
        <div className="grid grid-cols-[3rem_minmax(0,1fr)_5rem] items-center gap-4 px-5 py-4" key={item}>
          <span className="size-11 animate-pulse rounded-lg bg-brown-700/10" />
          <span className="space-y-2">
            <span className="block h-3 w-2/3 animate-pulse rounded bg-brown-700/10" />
            <span className="block h-2.5 w-1/3 animate-pulse rounded bg-brown-700/10" />
          </span>
          <span className="h-6 animate-pulse rounded-full bg-brown-700/10" />
        </div>
      ))}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, note, tone, onClick, isLoading }) {
  const tones = {
    brown: {
      icon: 'bg-brown-700 text-white',
      accent: 'from-brown-700 to-brown-500'
    },
    green: {
      icon: 'bg-emerald-700 text-white',
      accent: 'from-emerald-700 to-emerald-500'
    },
    gold: {
      icon: 'bg-gold-400 text-brown-900',
      accent: 'from-gold-400 to-amber-500'
    },
    cream: {
      icon: 'bg-cream-200 text-brown-700',
      accent: 'from-brown-500 to-gold-400'
    }
  };
  const selectedTone = tones[tone] || tones.brown;

  return (
    <motion.button
      variants={fadeSlideItem}
      whileHover={hoverLift}
      whileTap={tapPress}
      className="group relative min-h-44 overflow-hidden rounded-lg border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(255,248,238,0.92))] p-5 text-left shadow-[0_12px_32px_rgba(78,44,25,0.08),0_1px_2px_rgba(43,23,16,0.08)] transition-colors hover:border-gold-400/45 hover:shadow-[0_20px_46px_rgba(78,44,25,0.14)]"
      type="button"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`grid size-11 place-items-center rounded-lg shadow-sm ${selectedTone.icon}`}>
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
      {isLoading ? (
        <span className="mt-2 block h-9 w-16 animate-pulse rounded-md bg-brown-700/10" />
      ) : (
        <strong className="mt-1 block text-3xl font-black text-brown-900">
          {value}
        </strong>
      )}
      <span className="mt-2 block text-xs font-semibold text-slate-500">
        {note}
      </span>
      <span className={`pointer-events-none absolute inset-x-0 bottom-0 h-1 origin-left scale-x-75 bg-gradient-to-r ${selectedTone.accent} transition-transform duration-300 group-hover:scale-x-100`} />
    </motion.button>
  );
}

function WorkQueueCard({ icon: Icon, label, count, note, tone, onClick, isLoading }) {
  return (
    <motion.button
      whileHover={{ x: 3, transition: { duration: 0.16 } }}
      whileTap={tapPress}
      className="group grid min-h-[5.4rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-brown-700/10 bg-white/75 p-3.5 text-left shadow-[0_5px_16px_rgba(78,44,25,0.05)] transition-colors hover:border-gold-400/45 hover:bg-white hover:shadow-[0_12px_28px_rgba(78,44,25,0.1)] sm:gap-4 sm:p-4"
      type="button"
      onClick={onClick}
    >
      <span className={`grid size-11 place-items-center rounded-lg ${tone}`}>
        <Icon size={20} />
      </span>
      <span className="min-w-0">
        <strong className="block font-extrabold text-brown-900">{label}</strong>
        <small className="mt-1 block text-xs font-semibold leading-5 text-slate-500">
          {note}
        </small>
      </span>
      <span className="grid min-w-9 place-items-center rounded-full border border-brown-700/10 bg-cream-200 px-2 py-1.5 text-sm font-black text-brown-700">
        {isLoading ? <span className="size-3 animate-pulse rounded-full bg-brown-700/20" /> : count}
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
      note: `${data.refereeAssignments.length} cuộc đua đã có người phụ trách`,
      icon: Gavel
    },
    {
      key: 'users',
      label: 'Quản lý người dùng',
      note: `${activeUsers} tài khoản đang hoạt động`,
      icon: Users
    }
  ];

  return (
    <motion.section {...pageTransition} className="space-y-5 text-brown-900 lg:space-y-6">
      <header className="relative overflow-hidden rounded-lg border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(255,248,238,0.52))] px-5 py-5 shadow-[0_14px_40px_rgba(78,44,25,0.08)] backdrop-blur-sm sm:px-6 sm:py-6 md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs font-extrabold uppercase text-brown-500">
            Trung tâm điều hành
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Tổng quan vận hành
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
            Theo dõi hồ sơ, chuẩn bị danh sách thi đấu và điều phối các giải đấu
            từ một màn hình duy nhất.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/10 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800">
              <Activity size={14} /> {isLoading ? 'Đang đồng bộ' : `${activeUsers} tài khoản hoạt động`}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-brown-700/10 bg-cream-200/70 px-3 py-1.5 text-xs font-extrabold text-brown-700">
              <Trophy size={14} /> {isLoading ? 'Đang tải giải đấu' : `${data.tournaments.length} giải đấu`}
            </span>
          </div>
        </div>

        <button
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brown-700/15 bg-white px-4 py-2.5 text-sm font-extrabold text-brown-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-cream-100 disabled:translate-y-0 disabled:opacity-60 md:mt-0"
          type="button"
          onClick={loadOverview}
          disabled={isLoading}
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          Làm mới
        </button>
        <span className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full border border-gold-400/15" />
      </header>

      {error && (
        <div className="flex flex-col gap-3 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-danger sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </span>
          <button className="rounded-md border border-danger/20 bg-white px-3 py-2 text-xs font-extrabold transition hover:bg-danger-bg" type="button" onClick={loadOverview}>
            Thử lại
          </button>
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
          note={`${data.tournaments.length} giải đấu trong hệ thống`}
          tone="brown"
          isLoading={isLoading}
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={ClipboardCheck}
          label="Hồ sơ đang chờ xét duyệt"
          value={totalReviewQueue}
          note="Tổng hợp đơn đăng ký, ngựa và jockey"
          tone="gold"
          isLoading={isLoading}
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={Flag}
          label="Đang chờ xếp cuộc đua"
          value={data.raceEntryQueue.length}
          note={`${approvedRegistrations} đơn đăng ký đã được duyệt`}
          tone="green"
          isLoading={isLoading}
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={Gavel}
          label="Referee đã phân công"
          value={data.refereeAssignments.length}
          note="Cuộc đua đã có referee phụ trách"
          tone="cream"
          isLoading={isLoading}
          onClick={() => onNavigate('refereeAssignments')}
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.section whileHover={{ y: -2 }} className="rounded-lg border border-white/75 bg-cream-100 p-4 shadow-[0_18px_45px_rgba(78,44,25,0.1),0_1px_2px_rgba(43,23,16,0.08)] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">
                Cần xử lý
              </span>
              <h2 className="mt-1 text-2xl font-black">Hàng chờ công việc quản trị</h2>
            </div>
            <span className="shrink-0 rounded-full bg-danger-bg px-3 py-1 text-sm font-black text-danger">
              {isLoading ? '...' : totalReviewQueue + data.raceEntryQueue.length} đang chờ
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {workQueues.map(({ key, ...queue }) => (
              <WorkQueueCard
                key={key}
                {...queue}
                isLoading={isLoading}
                onClick={() => onNavigate(queue.target || key)}
              />
            ))}
          </div>
        </motion.section>

        <motion.section whileHover={{ y: -2 }} className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(145deg,#2b1710,#4a2819)] p-4 text-white shadow-[0_22px_52px_rgba(43,23,16,0.25)] sm:p-5">
          <span className="text-xs font-extrabold uppercase text-gold-400">
            Thao tác nhanh
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
          <span className="pointer-events-none absolute -bottom-14 -left-16 size-36 rounded-full border border-gold-400/10" />
        </motion.section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.08fr_0.72fr]">
        <motion.section whileHover={{ y: -2 }} className="overflow-hidden rounded-lg border border-white/75 bg-cream-100 shadow-[0_18px_45px_rgba(78,44,25,0.1),0_1px_2px_rgba(43,23,16,0.08)]">
          <div className="flex items-center justify-between gap-4 border-b border-brown-700/10 bg-cream-200/45 px-5 py-4">
            <div>
              <span className="text-xs font-extrabold uppercase text-brown-500">
                Lịch sự kiện
              </span>
              <h2 className="mt-1 text-xl font-black">Giải đấu sắp diễn ra</h2>
            </div>
            <CalendarDays size={22} className="text-brown-500" />
          </div>

          {isLoading ? (
            <OverviewLoadingRows />
          ) : (
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
                  className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left transition hover:bg-cream-200/40 sm:gap-4 sm:px-5"
                  key={tournament.tournamentId}
                  type="button"
                  onClick={() => onNavigate('events')}
                >
                  <span className="grid size-11 place-items-center rounded-lg border border-brown-700/10 bg-cream-200 font-black text-brown-700 shadow-sm">
                    <CalendarDays size={18} />
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-extrabold">
                      {tournament.tournamentName}
                    </strong>
                    <small className="mt-1 block truncate font-semibold text-slate-500">
                      {tournament.venue}
                    </small>
                  </span>
                  <span className="flex items-center gap-2 text-right">
                    <span>
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
                    <ChevronRight className="hidden text-brown-500/50 transition group-hover:translate-x-0.5 group-hover:text-brown-500 sm:block" size={17} />
                  </span>
                </button>
              ))
            )}
          </div>
          )}
        </motion.section>

        <motion.section whileHover={{ y: -2 }} className="rounded-lg border border-white/75 bg-cream-100 p-5 shadow-[0_18px_45px_rgba(78,44,25,0.1),0_1px_2px_rgba(43,23,16,0.08)]">
          <span className="text-xs font-extrabold uppercase text-brown-500">
            Vòng đời giải đấu
          </span>
          <h2 className="mt-1 text-xl font-black">Giải đấu theo trạng thái</h2>

          <div className="mt-5 grid gap-4">
            {tournamentStatuses.map(({ status, count }) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                key={status}
              >
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-3 text-sm font-extrabold">
                    <span>{formatStatus(status)}</span>
                    <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs">{isLoading ? '...' : count}</span>
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
