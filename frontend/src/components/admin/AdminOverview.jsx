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
  FileText,
  Gavel,
  RefreshCw,
  ShieldCheck,
  Trophy,
  UserCheck,
  Users
} from 'lucide-react';
import { formatDisplayLabel } from '../../lib';
import { useLanguage } from '../../context/LanguageContext';
import { getAdminOverview } from '../../services/adminService';
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

function formatStatus(status, t) {
  return t(`status_${status}`) || formatDisplayLabel(status);
}

function formatDate(value, language, t) {
  if (!value) return t('noDate');

  return new Date(`${value}T00:00:00`).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
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
  const { language, t } = useLanguage();
  const [data, setData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalTournaments: 0,
    openTournaments: 0,
    pendingRegistrations: 0,
    approvedRegistrations: 0,
    pendingHorses: 0,
    jockeyReviewProfiles: 0,
    pendingOwnerApplications: 0,
    raceEntryQueue: 0,
    refereeAssignments: 0,
    upcomingTournaments: [],
    tournamentStatuses: []
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
      const overview = await getAdminOverview();

      setData({
        totalUsers: Number(overview?.totalUsers || 0),
        activeUsers: Number(overview?.activeUsers || 0),
        totalTournaments: Number(overview?.totalTournaments || 0),
        openTournaments: Number(overview?.openTournaments || 0),
        pendingRegistrations: Number(overview?.pendingRegistrations || 0),
        approvedRegistrations: Number(overview?.approvedRegistrations || 0),
        pendingHorses: Number(overview?.pendingHorses || 0),
        jockeyReviewProfiles: Number(overview?.jockeyReviewProfiles || 0),
        pendingOwnerApplications: Number(overview?.pendingOwnerApplications || 0),
        raceEntryQueue: Number(overview?.raceEntryQueue || 0),
        refereeAssignments: Number(overview?.refereeAssignments || 0),
        upcomingTournaments: Array.isArray(overview?.upcomingTournaments)
          ? overview.upcomingTournaments
          : [],
        tournamentStatuses: Array.isArray(overview?.tournamentStatuses)
          ? overview.tournamentStatuses
          : []
      });
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu tổng quan.');
    } finally {
      setIsLoading(false);
    }
  }

  const totalReviewQueue =
    data.pendingRegistrations +
    data.pendingHorses +
    data.jockeyReviewProfiles +
    data.pendingOwnerApplications;

  const upcomingTournaments = useMemo(
    () => [...data.upcomingTournaments],
    [data.upcomingTournaments]
  );

  const tournamentStatuses = useMemo(() => {
    const statuses = [
      'OPEN_FOR_REGISTRATION',
      'REGISTRATION_CLOSED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED'
    ];

    const statusCountMap = new Map(
      data.tournamentStatuses.map((item) => [item.status, Number(item.count || 0)])
    );

    return statuses.map((status) => ({
      status,
      count: statusCountMap.get(status) || 0
    }));
  }, [data.tournamentStatuses]);

  const workQueues = [
    {
      key: 'ownerApplications',
      label: t('ownerApproval'),
      count: data.pendingOwnerApplications,
      note: t('ownerApprovalNote'),
      icon: FileText,
      tone: 'bg-rose-100 text-rose-700'
    },
    {
      key: 'registrations',
      target: 'events',
      label: t('registrationApproval'),
      count: data.pendingRegistrations,
      note: t('registrationApprovalNote'),
      icon: UserCheck,
      tone: 'bg-blue-100 text-blue-700'
    },
    {
      key: 'horseReviews',
      label: t('horseApproval'),
      count: data.pendingHorses,
      note: t('horseApprovalNote'),
      icon: ShieldCheck,
      tone: 'bg-green-100 text-green-700'
    },
    {
      key: 'jockeyReviews',
      label: t('jockeyApproval'),
      count: data.jockeyReviewProfiles,
      note: t('jockeyApprovalNote'),
      icon: ClipboardCheck,
      tone: 'bg-amber-100 text-amber-700'
    },
    {
      key: 'raceEntries',
      target: 'events',
      label: t('raceQueueSetup'),
      count: data.raceEntryQueue,
      note: t('raceQueueSetupNote'),
      icon: Flag,
      tone: 'bg-purple-100 text-purple-700'
    }
  ];

  const quickActions = [
    {
      key: 'events',
      label: t('setupTournament'),
      note: t('setupTournamentNote'),
      icon: Trophy
    },
    {
      key: 'ownerApplications',
      label: t('ownerApproval'),
      note: t('waitingCount', { count: data.pendingOwnerApplications }),
      icon: FileText
    },
    {
      key: 'refereeAssignments',
      label: t('refereeAssignments'),
      note: t('refereeAssignmentNote', { count: data.refereeAssignments }),
      icon: Gavel
    },
    {
      key: 'users',
      label: t('manageUsers'),
      note: t('activeAccountNote', { count: data.activeUsers }),
      icon: Users
    }
  ];

  return (
    <motion.section {...pageTransition} className="space-y-5 text-brown-900 lg:space-y-6">
      <header className="relative overflow-hidden rounded-lg border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(255,248,238,0.52))] px-5 py-5 shadow-[0_14px_40px_rgba(78,44,25,0.08)] backdrop-blur-sm sm:px-6 sm:py-6 md:flex md:items-center md:justify-between md:gap-6">
        <div>
          <p className="text-xs font-extrabold uppercase text-brown-500">
            {t('operationsCenter')}
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            {t('operationsOverview')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500 sm:text-base">
            {t('operationsOverviewSubtitle')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-700/10 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-800">
              <Activity size={14} /> {isLoading ? t('syncing') : t('activeAccountCount', { count: data.activeUsers })}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-brown-700/10 bg-cream-200/70 px-3 py-1.5 text-xs font-extrabold text-brown-700">
              <Trophy size={14} /> {isLoading ? t('loadingTournaments') : t('tournamentCount', { count: data.totalTournaments })}
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
          {t('refresh')}
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
            {t('retry')}
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
          label={t('openTournaments')}
          value={data.openTournaments}
          note={t('tournamentsInSystem', { count: data.totalTournaments })}
          tone="brown"
          isLoading={isLoading}
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={ClipboardCheck}
          label={t('reviewQueueProfiles')}
          value={totalReviewQueue}
          note={t('reviewQueueProfilesNote')}
          tone="gold"
          isLoading={isLoading}
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={Flag}
          label={t('raceEntryQueue')}
          value={data.raceEntryQueue}
          note={t('approvedRegistrationCount', { count: data.approvedRegistrations })}
          tone="green"
          isLoading={isLoading}
          onClick={() => onNavigate('events')}
        />
        <MetricCard
          icon={Gavel}
          label={t('assignedReferees')}
          value={data.refereeAssignments}
          note={t('assignedRefereesNote')}
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
                {t('needsProcessing')}
              </span>
              <h2 className="mt-1 text-2xl font-black">{t('adminWorkQueue')}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-danger-bg px-3 py-1 text-sm font-black text-danger">
              {isLoading ? '...' : t('waitingCount', { count: totalReviewQueue + data.raceEntryQueue })}
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
            {t('quickActions')}
          </span>
          <h2 className="mt-1 text-2xl font-black">{t('continueSetup')}</h2>

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
                {t('eventSchedule')}
              </span>
              <h2 className="mt-1 text-xl font-black">{t('upcomingTournaments')}</h2>
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
                  <p className="mt-3 font-extrabold text-brown-900">{t('noUpcomingTournaments')}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{t('noUpcomingTournamentsNote')}</p>
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
                      {formatDate(tournament.startDate, language, t)}
                    </time>
                    <small
                      className={`mt-1 inline-flex rounded-full px-2 py-1 text-[0.68rem] font-extrabold ${
                        STATUS_STYLES[tournament.status] ||
                        'bg-cream-200 text-brown-700'
                      }`}
                    >
                      {formatStatus(tournament.status, t)}
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
            {t('tournamentLifecycle')}
          </span>
          <h2 className="mt-1 text-xl font-black">{t('tournamentsByStatus')}</h2>

          <div className="mt-5 grid gap-4">
            {tournamentStatuses.map(({ status, count }) => (
              <div
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                key={status}
              >
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-3 text-sm font-extrabold">
                    <span>{formatStatus(status, t)}</span>
                    <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs">{isLoading ? '...' : count}</span>
                  </span>
                  <span className="mt-2 block h-2 overflow-hidden rounded-full bg-cream-200">
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          data.totalTournaments
                            ? Math.max((count / data.totalTournaments) * 100, count ? 8 : 0)
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
