import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CircleDollarSign,
  CalendarDays,
  Clock3,
  Flag,
  Gauge,
  Home,
  Medal,
  Radio,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trophy,
  UserRound,
  Wallet
} from 'lucide-react';
import OwnerApplicationForm from '../profile/OwnerApplicationForm';
import JockeyApplicationForm from '../profile/JockeyApplicationForm';
import WalletTransferPanel from '../payment/WalletTransferPanel';
import BettingPanel from './BettingPanel';
import LanguageToggle from '../common/LanguageToggle';
import RaceLiveView from '../shared/live/RaceLiveView';
import RaceResultLeaderboard from '../admin/events/race-entry/RaceResultLeaderboard';
import { useLanguage } from '../../context/LanguageContext';
import { formatDate, formatDisplayLabel, getUserRole } from '../../lib';
import { getMyOwnerApplication, submitOwnerApplication } from '../../services/ownerApplicationService';
import {
  getMyJockeyVerification,
  resubmitJockeyVerification,
  submitJockeyVerification
} from '../../services/jockeyVerificationService';
import { getMyKyc, needsKycSubmission } from '../../services/kycService';
import { getRaceResults, getRaces } from '../../services/eventService';
import { getBettingEvents } from '../../services/bettingService';

const navItems = [
  { key: 'dashboard', labelKey: 'spectatorNavDashboard', icon: Home },
  { key: 'horses', labelKey: 'spectatorNavHorses', icon: Trophy },
  { key: 'races', labelKey: 'spectatorNavRaces', icon: Flag },
  { key: 'betting', labelKey: 'spectatorNavBetting', icon: CircleDollarSign, accountTypes: ['SPECTATOR'] },
  { key: 'results', labelKey: 'spectatorNavResults', icon: Medal },
  { key: 'profile', labelKey: 'spectatorNavProfile', icon: UserRound },
  { key: 'wallet', labelKey: 'wallet', icon: Wallet, accountTypes: ['SPECTATOR'] }
];

function formatLocalizedStatus(t, status) {
  const key = `status_${String(status || 'NOT_SUBMITTED').toUpperCase()}`;
  const translated = t(key);
  return translated === key ? formatDisplayLabel(status || 'NOT_SUBMITTED') : translated;
}

function StatusBadge({ status }) {
  const { t } = useLanguage();
  const normalized = String(status || 'not-registered').toLowerCase().replace(/\s+/g, '-');

  return <span className={`status-badge ${normalized}`}>{formatLocalizedStatus(t, status)}</span>;
}

function getKycStatus(kyc) {
  return String(kyc?.status || 'NOT_SUBMITTED').toUpperCase();
}

function EmptyState({ title, message }) {
  return (
    <div className="rounded-[24px] border border-dashed border-brown-700/20 bg-white/60 p-8 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-cream-200 text-2xl">🏇</div>
      <h3 className="mt-4 text-xl font-black text-brown-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl font-medium text-slate-500">{message}</p>
    </div>
  );
}

function raceStart(race) {
  if (!race?.raceStartTime) return null;
  const date = new Date(race.raceStartTime);
  return Number.isNaN(date.getTime()) ? null : date;
}

function raceDateTime(race, language = 'vi') {
  const date = raceStart(race);
  return date ? date.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
  }) : 'Chua cap nhat';
}

function canViewLiveRace(race) {
  return String(race?.status || '').toUpperCase() === 'IN_PROGRESS';
}

function raceStatus(race) {
  return String(race?.status || 'UNKNOWN').toUpperCase();
}

function getRaceDisplayName(race) {
  return race?.raceName || race?.name || `Race #${race?.raceId || '-'}`;
}

function getTotalRecordedPrize(results) {
  return results.reduce((sum, result) => sum + Number(result.prizeMoney || result.totalPrize || 0), 0);
}

function isUpcomingRace(race) {
  const start = raceStart(race);
  return start && start >= new Date() && !['COMPLETED', 'CANCELLED'].includes(raceStatus(race));
}

function getRaceImageUrl(race) {
  return String(race?.trackImageUrl || race?.trackImagePath || '').trim();
}

function raceSearchText(race) {
  return [
    race?.raceName,
    race?.trackName,
    race?.tournamentName,
    race?.status,
    race?.raceOrder,
    race?.distance
  ].filter(Boolean).join(' ').toLowerCase();
}

function DashboardHome({ accountType, onGoProfile, onNavigate, races, bettingEvents, isLoading, error }) {
  const { t, language } = useLanguage();
  const isSpectator = accountType === 'SPECTATOR';
  const professionalLabel = accountType === 'OWNER' ? 'Owner' : 'Jockey';
  const now = new Date();
  const upcomingRaces = races
    .filter((race) => {
      const start = raceStart(race);
      const status = String(race?.status || '').toUpperCase();
      return start && start >= now && !['COMPLETED', 'CANCELLED'].includes(status);
    })
    .sort((left, right) => raceStart(left) - raceStart(right));
  const todayRaces = races.filter((race) => raceStart(race)?.toDateString() === now.toDateString());
  const openBettingEvents = bettingEvents.filter((event) => String(event?.status || '').toUpperCase() === 'OPEN');
  const liveRaces = races.filter(canViewLiveRace);
  const completedRaces = races.filter((race) => raceStatus(race) === 'COMPLETED');
  const nextRace = upcomingRaces[0] || null;
  const featuredBettingEvent = openBettingEvents[0] || null;
  const heroTitle = isSpectator ? t('spectatorDashboardTitle') : `Complete your ${professionalLabel} application`;
  const heroDescription = isSpectator
    ? t('spectatorDashboardDesc')
    : `Your account is active. Submit the required ${professionalLabel} documents and wait for administrator approval to unlock professional features.`;
  const metricCards = [
    {
      label: t('spectatorTotalRaces'),
      value: isLoading ? '...' : races.length,
      detail: t('spectatorTotalRacesDesc'),
      icon: Flag,
      tone: 'primary'
    },
    {
      label: t('spectatorUpcomingRaces'),
      value: isLoading ? '...' : upcomingRaces.length,
      detail: t('spectatorUpcomingRacesDesc'),
      icon: CalendarDays,
      tone: 'gold'
    },
    {
      label: t('spectatorTodayRaces'),
      value: isLoading ? '...' : todayRaces.length,
      detail: t('spectatorTodayRacesDesc'),
      icon: Clock3,
      tone: 'teal'
    },
    {
      label: isSpectator ? t('spectatorOpenBetting') : 'Application',
      value: isLoading ? '...' : isSpectator ? openBettingEvents.length : 'Required',
      detail: isSpectator ? t('spectatorOpenBettingDesc') : `${professionalLabel} access requires admin approval`,
      icon: isSpectator ? CircleDollarSign : ShieldCheck,
      tone: 'blue'
    }
  ];

  return (
    <section className="spectator-overview-page">
      {error && <div className="admin-alert error" role="alert">{error}</div>}

      <section className="spectator-overview-hero">
        <div className="spectator-overview-hero-copy">
          <span className="spectator-overview-kicker">
            <Gauge size={15} aria-hidden="true" />
            {isSpectator ? t('spectatorDashboard') : `${professionalLabel} Onboarding`}
          </span>
          <h2>{heroTitle}</h2>
          <p>{heroDescription}</p>

          <div className="spectator-overview-action-row" aria-label="Spectator quick actions">
            <button className="spectator-overview-action primary" type="button" onClick={() => onNavigate?.('races')}>
              <span><Radio size={18} aria-hidden="true" /></span>
              <strong>{t('spectatorNavRaces')}</strong>
              <small>{t('spectatorLiveUpcomingSummary', { live: liveRaces.length, upcoming: upcomingRaces.length })}</small>
            </button>
            {isSpectator ? (
              <button className="spectator-overview-action" type="button" onClick={() => onNavigate?.('betting')}>
                <span><CircleDollarSign size={18} aria-hidden="true" /></span>
                <strong>{t('spectatorNavBetting')}</strong>
                <small>{t('spectatorOpenEventsSummary', { count: openBettingEvents.length })}</small>
              </button>
            ) : (
              <button className="spectator-overview-action" type="button" onClick={onGoProfile}>
                <span><ShieldCheck size={18} aria-hidden="true" /></span>
                <strong>Open {professionalLabel} Application</strong>
                <small>Submit documents for review</small>
              </button>
            )}
          </div>
        </div>

        <aside className="spectator-overview-live-card">
          <span className="spectator-overview-kicker">
            <Radio size={15} aria-hidden="true" />
            {t('spectatorLiveDesk')}
          </span>
          <strong>{isLoading ? '...' : liveRaces.length}</strong>
          <p>{t('spectatorLiveDeskDesc')}</p>
          <button className="spectator-overview-mini-action" type="button" onClick={() => onNavigate?.('races')}>
            {t('spectatorViewLiveRaces')}
          </button>
        </aside>
      </section>

      <section className="spectator-overview-metrics" aria-label="Spectator dashboard metrics">
        {metricCards.map(({ label, value, detail, icon: Icon, tone }) => (
          <article className={`spectator-overview-metric-card ${tone}`} key={label}>
            <div className="spectator-overview-metric-icon">
              <Icon size={19} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{detail}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="spectator-overview-grid">
        <article className="spectator-overview-panel">
          <header className="spectator-overview-panel-header">
            <div>
              <span className="spectator-overview-kicker">{t('spectatorUpcomingCards')}</span>
              <h3>{t('spectatorRaceHighlights')}</h3>
              <p>{t('spectatorRaceHighlightsDesc')}</p>
            </div>
            <button className="spectator-overview-secondary-action" type="button" onClick={() => onNavigate?.('races')}>
              {t('spectatorViewAll')}
            </button>
          </header>

          <div className="spectator-overview-race-list">
            {isLoading ? (
              <div className="spectator-overview-loading" role="status">{t('spectatorLoadingRaces')}</div>
            ) : upcomingRaces.length === 0 ? (
              <EmptyState title={t('spectatorNoUpcomingRaces')} message={t('spectatorNoUpcomingRacesDesc')} />
            ) : (
              upcomingRaces.slice(0, 4).map((race, index) => (
                <button className="spectator-overview-race-row" type="button" onClick={() => onNavigate?.('races')} key={race.raceId}>
                  <span className="spectator-overview-race-order">#{index + 1}</span>
                  <span className="spectator-overview-race-main">
                    <strong>{getRaceDisplayName(race)}</strong>
                    <small>{race.trackName || t('spectatorTrackMissing')} · {raceDateTime(race, language)}</small>
                  </span>
                  <span className={`status-badge ${String(race.status || '').toLowerCase().replaceAll('_', '-')}`}>
                    {formatLocalizedStatus(t, race.status)}
                  </span>
                </button>
              ))
            )}
          </div>
        </article>

        <aside className="spectator-overview-panel spectator-overview-side-panel">
          <div className="spectator-overview-panel-header compact">
            <div>
              <span className="spectator-overview-kicker">{t('spectatorOperations')}</span>
              <h3>{t('spectatorNextActions')}</h3>
            </div>
          </div>

          <div className="spectator-overview-next-list">
            <button type="button" onClick={() => onNavigate?.('results')}>
              <Medal size={18} aria-hidden="true" />
              <span>
                <strong>{t('spectatorNavResults')}</strong>
                <small>{t('spectatorCompletedRaces', { count: completedRaces.length })}</small>
              </span>
            </button>
            {isSpectator && (
              <button type="button" onClick={() => onNavigate?.('wallet')}>
                <Wallet size={18} aria-hidden="true" />
                <span>
                  <strong>{t('wallet')}</strong>
                  <small>{t('spectatorWalletActionDesc')}</small>
                </span>
              </button>
            )}
            <button type="button" onClick={onGoProfile}>
              <UserRound size={18} aria-hidden="true" />
              <span>
                <strong>{t('spectatorViewProfile')}</strong>
                <small>{t('spectatorProfileActionDesc')}</small>
              </span>
            </button>
          </div>

          <div className="spectator-overview-betting-card">
            <span className="spectator-overview-kicker">{isSpectator ? t('spectatorBettingQueue') : 'Account readiness'}</span>
            <h4>{isSpectator ? (featuredBettingEvent?.raceName || t('spectatorNoOpenBetting')) : `${professionalLabel} application`}</h4>
            <p>
              {isSpectator
                ? (featuredBettingEvent ? t('spectatorPoolStatus', { status: formatLocalizedStatus(t, featuredBettingEvent.status) }) : t('spectatorOpenBettingHint'))
                : 'Professional access unlocks after Admin approval.'}
            </p>
            <button className="spectator-overview-mini-action" type="button" onClick={() => isSpectator ? onNavigate?.('betting') : onGoProfile()}>
              {isSpectator ? t('spectatorNavBetting') : `Open ${professionalLabel} Application`}
            </button>
          </div>
        </aside>
      </section>

      {nextRace && (
        <section className="spectator-overview-timeline" aria-label="Next race spotlight">
          <div>
            <span className="spectator-overview-kicker">{t('spectatorNextRace')}</span>
            <h3>{getRaceDisplayName(nextRace)}</h3>
            <p>{nextRace.trackName || t('spectatorTrackMissing')} · {raceDateTime(nextRace, language)}</p>
          </div>
          <div className="spectator-overview-timeline-stats">
            <span>{t('spectatorRunners', { entries: nextRace.entryCount ?? 0, max: nextRace.maxRunners ?? 0 })}</span>
            <span>{nextRace.distance ? `${nextRace.distance}m` : t('spectatorDistanceMissing')}</span>
            <span>{formatLocalizedStatus(t, nextRace.status)}</span>
          </div>
        </section>
      )}
    </section>
  );
}

function PlaceholderSection({ title, message, icon }) {
  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <div className="grid size-12 place-items-center rounded-2xl bg-cream-200 text-2xl">{icon}</div>
      </div>
      <EmptyState title={`No ${title.toLowerCase()} data yet.`} message={message} />
    </section>
  );
}

function RaceListSection({ title, races, isLoading, resultsOnly = false }) {
  const { t, language } = useLanguage();
  const [liveRaceId, setLiveRaceId] = useState(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(resultsOnly ? 'COMPLETED' : 'ALL');
  const [resultRace, setResultRace] = useState(null);
  const [resultRows, setResultRows] = useState([]);
  const [resultError, setResultError] = useState('');
  const [isResultLoading, setIsResultLoading] = useState(false);
  const visibleRaces = resultsOnly
    ? races.filter((race) => String(race?.status || '').toUpperCase() === 'COMPLETED')
    : races;
  const statusOptions = useMemo(() => {
    const values = Array.from(new Set(visibleRaces.map((race) => raceStatus(race)).filter(Boolean))).sort();
    return ['ALL', ...values];
  }, [visibleRaces]);
  const filteredRaces = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return visibleRaces.filter((race) => {
      const matchesStatus = statusFilter === 'ALL' || raceStatus(race) === statusFilter;
      const matchesQuery = !needle || raceSearchText(race).includes(needle);
      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, visibleRaces]);
  const liveRaces = visibleRaces.filter(canViewLiveRace);
  const upcomingRaces = visibleRaces.filter(isUpcomingRace);
  const completedRaces = visibleRaces.filter((race) => raceStatus(race) === 'COMPLETED');
  const nextRace = [...upcomingRaces].sort((left, right) => raceStart(left) - raceStart(right))[0] || null;
  const activeLiveRace = liveRaces.find((race) => race.raceId === liveRaceId) || liveRaces[0] || null;

  function toggleLiveRace(raceId) {
    setLiveRaceId((current) => (current === raceId ? null : raceId));
  }

  async function openOfficialResult(race) {
    if (!race?.raceId) return;
    setResultRace(race);
    setResultRows([]);
    setResultError('');
    setIsResultLoading(true);

    try {
      const response = await getRaceResults(race.raceId);
      setResultRows(Array.isArray(response) ? response : []);
    } catch (error) {
      setResultError(error?.message || (language === 'vi' ? 'Không thể tải kết quả Race.' : 'Unable to load race result.'));
    } finally {
      setIsResultLoading(false);
    }
  }

  return (
    <section className="spectator-races-page">
      <div className="spectator-races-hero">
        <div className="spectator-races-hero-copy">
          <p className="eyebrow">{title}</p>
          <h2>{resultsOnly ? t('spectatorNavResults') : t('spectatorUpcomingCards')}</h2>
          <p>{resultsOnly ? t('spectatorResultsDesc') : t('spectatorRaceApiData')}</p>
        </div>
        <div className="spectator-races-hero-icon" aria-hidden="true">
          {resultsOnly ? <Medal size={26} /> : <Flag size={26} />}
        </div>
      </div>

      <div className="spectator-race-stats">
        <div className="spectator-race-stat-card primary">
          <span>{resultsOnly ? t('spectatorNavResults') : t('spectatorTotalRaces')}</span>
          <strong>{isLoading ? '...' : visibleRaces.length}</strong>
          <small>{resultsOnly ? t('spectatorResultsDesc') : t('spectatorTotalRacesDesc')}</small>
        </div>
        <div className="spectator-race-stat-card">
          <span>{t('spectatorLiveNow')}</span>
          <strong>{isLoading ? '...' : liveRaces.length}</strong>
          <small>{formatLocalizedStatus(t, 'IN_PROGRESS')}</small>
        </div>
        <div className="spectator-race-stat-card">
          <span>{t('spectatorUpcomingRaces')}</span>
          <strong>{isLoading ? '...' : upcomingRaces.length}</strong>
          <small>{nextRace ? raceDateTime(nextRace, language) : t('notUpdated')}</small>
        </div>
        <div className="spectator-race-stat-card">
          <span>{t('spectatorNavResults')}</span>
          <strong>{isLoading ? '...' : completedRaces.length}</strong>
          <small>{formatLocalizedStatus(t, 'COMPLETED')}</small>
        </div>
      </div>

      {!resultsOnly && activeLiveRace && (
        <section className="spectator-live-feature">
          <div className="spectator-live-feature-header">
            <div>
              <p className="eyebrow">{t('eventRaceLiveShow')}</p>
              <h3>{activeLiveRace.raceName}</h3>
              <span>{activeLiveRace.trackName || t('spectatorTrackMissing')} · {raceDateTime(activeLiveRace, language)}</span>
            </div>
            <button
              className="primary-button compact-button"
              type="button"
              aria-expanded={liveRaceId === activeLiveRace.raceId}
              onClick={() => toggleLiveRace(activeLiveRace.raceId)}
            >
              <Radio size={15} />
              {liveRaceId === activeLiveRace.raceId ? t('eventRaceLiveHide') : t('eventRaceLiveShow')}
            </button>
          </div>
          <RaceLiveView raceId={activeLiveRace.raceId} active={liveRaceId === activeLiveRace.raceId} />
        </section>
      )}

      <section className="spectator-race-toolbar">
        <label className="spectator-race-search">
          <Search size={18} />
          <span className="sr-only">{t('spectatorSearchRaces')}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('spectatorSearchPlaceholder')}
          />
        </label>
        <label className="spectator-race-filter">
          <SlidersHorizontal size={16} />
          <span className="sr-only">{t('spectatorFilterStatus')}</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? t('spectatorFilterAll') : formatLocalizedStatus(t, status)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {isLoading ? (
        <div className="spectator-races-loading" role="status">
          {[0, 1, 2].map((item) => <span key={item} />)}
        </div>
      ) : visibleRaces.length === 0 ? (
        <EmptyState title={t('spectatorNoRaceData', { name: title.toLowerCase() })} message={t('spectatorNoMatchingRaces')} />
      ) : filteredRaces.length === 0 ? (
        <EmptyState title={t('spectatorNoMatchingRaces')} message={t('spectatorNoRaceData', { name: title.toLowerCase() })} />
      ) : (
        <div className="spectator-race-grid">
          {filteredRaces.map((race) => {
            const imageUrl = getRaceImageUrl(race);
            const live = canViewLiveRace(race);

            return (
              <article className={live ? 'spectator-race-card live' : 'spectator-race-card'} key={race.raceId}>
                <div className={`spectator-race-image ${imageUrl ? 'has-image' : ''}`}>
                  {imageUrl ? <img src={imageUrl} alt={race.trackName || race.raceName} /> : <Flag size={24} />}
                </div>
                <div className="spectator-race-body">
                  <div className="spectator-race-title-row">
                    <div className="min-w-0">
                      <span className="spectator-race-kicker">{race.tournamentName || `Race #${race.raceId}`}</span>
                      <h3>{race.raceName}</h3>
                    </div>
                    <StatusBadge status={race.status} />
                  </div>
                  <div className="spectator-race-meta">
                    <span><CalendarDays size={15} /> {raceDateTime(race, language)}</span>
                    <span><Flag size={15} /> {race.trackName || t('spectatorTrackMissing')}</span>
                    <span><Trophy size={15} /> {t('spectatorRunners', { entries: race.entryCount ?? 0, max: race.maxRunners ?? 0 })}</span>
                    <span><Clock3 size={15} /> {race.distance ? `${race.distance}m` : t('notUpdated')}</span>
                  </div>
                </div>
                <div className="spectator-race-actions">
                  {resultsOnly ? (
                    <button
                      className="primary-button compact-button"
                      type="button"
                      onClick={() => openOfficialResult(race)}
                    >
                      <Medal size={15} />
                      {t('spectatorViewResult')}
                    </button>
                  ) : live ? (
                    <button
                      className="primary-button compact-button"
                      type="button"
                      aria-expanded={liveRaceId === race.raceId}
                      onClick={() => toggleLiveRace(race.raceId)}
                    >
                      <Radio size={15} />
                      {liveRaceId === race.raceId ? t('eventRaceLiveHide') : t('eventRaceLiveShow')}
                    </button>
                  ) : (
                    <span className="spectator-race-muted-action">
                      {resultsOnly ? t('spectatorNavResults') : formatLocalizedStatus(t, race.status)}
                    </span>
                  )}
                </div>
                {live && liveRaceId === race.raceId && (
                  <div className="spectator-race-live-inline">
                    <RaceLiveView raceId={race.raceId} active />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {resultRace && (
        <div className="owner-race-result-backdrop" role="presentation" onClick={() => setResultRace(null)}>
          <section
            className="owner-race-result-modal spectator-race-result-modal"
            role="dialog"
            aria-modal="true"
            aria-label={language === 'vi' ? 'Kết quả Race chính thức' : 'Official race result'}
            onClick={(event) => event.stopPropagation()}
          >
            {isResultLoading ? (
              <div className="admin-alert success" role="status">
                {language === 'vi' ? 'Đang tải kết quả Race...' : 'Loading race result...'}
              </div>
            ) : resultError ? (
              <div className="admin-alert error" role="alert">
                <span>{resultError}</span>
                <button className="table-button" type="button" onClick={() => openOfficialResult(resultRace)}>
                  {language === 'vi' ? 'Thử lại' : 'Retry'}
                </button>
              </div>
            ) : resultRows.length === 0 ? (
              <div className="admin-alert success" role="status">
                {language === 'vi' ? 'Chưa có kết quả chính thức cho Race này.' : 'No official result is available for this race yet.'}
              </div>
            ) : (
              <RaceResultLeaderboard
                race={{ ...resultRace, name: getRaceDisplayName(resultRace) }}
                results={resultRows}
                totalPrize={getTotalRecordedPrize(resultRows)}
                onClose={() => setResultRace(null)}
                userRole="SPECTATOR"
              />
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function ApplicationDetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      <strong className="mt-1 block break-words text-brown-900">{value || 'Chua cap nhat'}</strong>
    </div>
  );
}

function ApplicationDocumentLink({ label, url }) {
  const documentUrl = String(url || '').trim();

  function openDocument() {
    if (!documentUrl) return;
    window.open(documentUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
      {documentUrl ? (
        <button className="outline-button compact-button mt-3" type="button" onClick={openDocument}>
          View
        </button>
      ) : (
        <strong className="mt-1 block text-brown-900">Chua co file</strong>
      )}
    </div>
  );
}

function OwnerApplicationDetail({ application }) {
  if (!application) return null;

  return (
    <section className="owner-panel">
      <div className="owner-panel-header">
        <div>
          <p className="eyebrow">Submitted Application</p>
          <h2>Ho so Owner da gui</h2>
          <p>Thong tin nay dang duoc admin xem xet.</p>
        </div>
        <StatusBadge status={application.status} />
      </div>

      <div className="grid gap-5">
        <div>
          <h3 className="text-xl font-black text-brown-900">Stable Information</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ApplicationDetailItem label="Stable Name" value={application.stableName} />
            <ApplicationDetailItem label="Stable Address" value={application.stableAddress} />
            <ApplicationDocumentLink label="Stable Certificate" url={application.stableCertificateUrl} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-brown-900">Horse Ownership Proof</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ApplicationDetailItem label="Total Horses Owned" value={application.totalHorsesOwned} />
            <ApplicationDocumentLink label="Horse Ownership Proof" url={application.horseOwnershipProofUrl} />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-brown-900">Application Information</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <ApplicationDetailItem label="Status" value={application.status} />
            <ApplicationDetailItem label="Submitted At" value={formatDate(application.submittedAt)} />
            <ApplicationDetailItem label="Reviewed At" value={formatDate(application.reviewedAt)} />
            <ApplicationDetailItem label="Reject Reason" value={application.rejectReason} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileSection({ user, ownerApplication, jockeyApplication, kyc, isLoading, onOpenApplication, onOpenAgain, onBecomeJockey, onOpenKyc }) {
  const { t } = useLanguage();
  const role = getUserRole(user) || 'SPECTATOR';
  const accountType = String(user?.accountType || role).toUpperCase();
  const status = ownerApplication?.status || null;
  const jockeyStatus = jockeyApplication?.verificationStatus || null;
  const kycStatus = getKycStatus(kyc);
  const isKycVerified = kycStatus === 'VERIFIED';
  const profileDisplayName = kyc?.verifiedFullName || user?.fullName || user?.email;
  const [showOwnerApplicationDetail, setShowOwnerApplicationDetail] = useState(false);

  const detailRows = [
    [t('spectatorUsername'), user?.username || user?.fullName || t('jockeyNotUpdated')],
    [t('spectatorEmail'), user?.email || t('jockeyNotUpdated')],
    [t('spectatorPhone'), user?.phone || t('jockeyNotUpdated')],
    [t('spectatorAccountType'), <span className="role-badge" key="account-type">{formatDisplayLabel(accountType)}</span>],
    [t('spectatorAccessRole'), <span className="role-badge" key="role">{formatDisplayLabel(role)}</span>]
  ];

  if (accountType === 'OWNER') detailRows.push(['Owner Status', <StatusBadge key="status" status={status} />]);
  if (accountType === 'JOCKEY') detailRows.push(['Jockey Status', <StatusBadge key="jockey-status" status={jockeyStatus} />]);

  if (status === 'PENDING') {
    detailRows.push(['Application Date', formatDate(ownerApplication.submittedAt)]);
  }

  if (status === 'REJECTED') {
    detailRows.push(['Rejected Date', formatDate(ownerApplication.rejectedAt)]);
    detailRows.push(['Reject Reason', ownerApplication.rejectReason || 'Chưa cập nhật']);
  }

  if (status === 'APPROVED') {
    detailRows.push(['Approval Date', formatDate(ownerApplication.approvedAt)]);
    detailRows.push(['Owner Since', formatDate(ownerApplication.ownerSince)]);
  }

  return (
    <section className="owner-stack">
      <section className="owner-panel">
        <div className="owner-panel-header">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-[22px] bg-brown-900 text-2xl text-gold-400">
              {(profileDisplayName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="eyebrow">{t('spectatorProfile')}</p>
              <h2>{profileDisplayName}</h2>
              <p>{t('spectatorProfileDesc')}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="admin-alert success" role="status">{t('spectatorLoadingProfile')}</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {detailRows.map(([label, value]) => (
              <div className="rounded-2xl border border-brown-700/10 bg-white/70 p-4" key={label}>
                <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</span>
                <strong className="mt-1 block break-words text-brown-900">{value}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={kycStatus === 'IN_REVIEW' ? 'owner-panel warning-owner-panel' : 'owner-panel'}>
        <div className="owner-panel-header">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-cream-200 text-brown-700">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="eyebrow">{t('spectatorKycVerification')}</p>
              <h2>{t('spectatorIdentityVerification')}</h2>
              <p>
                {needsKycSubmission(kyc)
                  ? t('spectatorKycSubmitDesc')
                  : kycStatus === 'IN_REVIEW'
                    ? t('spectatorKycReviewDesc')
                    : t('spectatorKycVerifiedDesc')}
              </p>
            </div>
          </div>
          <StatusBadge status={kycStatus} />
        </div>

        {kycStatus === 'REJECTED' && kyc?.rejectionReason && (
          <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
            {kyc.rejectionReason}
          </div>
        )}

        {isKycVerified && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">{t('spectatorVerifiedName')}</span>
              <strong className="mt-1 block break-words text-brown-900">{kyc?.verifiedFullName || t('spectatorNotProvided')}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">{t('spectatorDateOfBirth')}</span>
              <strong className="mt-1 block text-brown-900">{formatDate(kyc?.verifiedDateOfBirth)}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">{t('spectatorDocument')}</span>
              <strong className="mt-1 block text-brown-900">
                {formatDisplayLabel(kyc?.documentType || 'Identity document')}
                {kyc?.documentLastFour ? ` **** ${kyc.documentLastFour}` : ''}
              </strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">{t('spectatorVerifiedBy')}</span>
              <strong className="mt-1 block text-brown-900">{formatDisplayLabel(kyc?.provider || 'DIDIT')}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">{t('spectatorVerifiedAt')}</span>
              <strong className="mt-1 block text-brown-900">{formatDate(kyc?.verifiedAt)}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4">
              <span className="block text-xs font-extrabold uppercase text-slate-500">{t('spectatorDocumentExpiry')}</span>
              <strong className="mt-1 block text-brown-900">{kyc?.documentExpiryDate ? formatDate(kyc.documentExpiryDate) : t('spectatorNoDocumentExpiry')}</strong>
            </div>
            <div className="rounded-lg border border-brown-700/10 bg-white/70 p-4 md:col-span-2">
              <span className="block text-xs font-extrabold uppercase text-slate-500">{t('spectatorWalletAccess')}</span>
              <strong className="mt-1 flex items-center gap-2 text-brown-900">
                <StatusBadge status={kyc?.walletOpen ? 'ACTIVE' : 'PENDING'} />
                {kyc?.walletOpen
                  ? t('spectatorBettingWalletEnabled')
                  : t('spectatorWalletOpening')}
              </strong>
            </div>
          </div>
        )}

        {isLoading ? (
          <button className="outline-button mt-5" type="button" disabled>
            {t('spectatorLoadingKyc')}
          </button>
        ) : needsKycSubmission(kyc) ? (
          <button className="primary-button owner-hero-action mt-5" type="button" onClick={onOpenKyc}>
            {kycStatus === 'REJECTED' || kycStatus === 'EXPIRED' ? t('spectatorVerifyAgain') : t('spectatorOpenWallet')}
          </button>
        ) : isKycVerified ? (
          <button className="primary-button owner-hero-action mt-5" type="button" onClick={onOpenKyc}>
            {t('spectatorGoWallet')}
          </button>
        ) : (
          <button className="outline-button mt-5" type="button" disabled>
            {kycStatus === 'IN_REVIEW' ? t('spectatorDiditReview') : t('spectatorKycProgress')}
          </button>
        )}
      </section>

      {accountType === 'OWNER' && !status && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Not Registered</p>
            <h2>Your Owner application is required.</h2>
            <p>Submit stable and horse ownership documents for administrator review.</p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button" onClick={onOpenApplication}>
              Start Owner Application
            </button>
          </div>
        </section>
      )}

      {accountType === 'JOCKEY' && !jockeyStatus && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Application Required</p>
            <h2>Your Jockey application is required.</h2>
            <p>Submit your licence and professional information for administrator review.</p>
          </div>
          <button className="primary-button owner-hero-action" type="button" onClick={onBecomeJockey}>
            Start Jockey Application
          </button>
        </section>
      )}

      {accountType === 'JOCKEY' && jockeyStatus === 'PENDING' && (
        <section className="owner-panel warning-owner-panel">
          <p className="eyebrow">Jockey Pending Approval</p>
          <h2>Your Jockey application has been submitted and is waiting for administrator approval.</h2>
          <p>After admin approval, sign out and sign in again to enter the Jockey dashboard.</p>
          <button className="outline-button mt-5" type="button" disabled>
            Waiting For Approval
          </button>
        </section>
      )}

      {accountType === 'JOCKEY' && jockeyStatus === 'REJECTED' && (
        <section className="owner-panel">
          <p className="eyebrow">Jockey Rejected</p>
          <h2>Your Jockey application has been rejected.</h2>
          <p>Please update the required information and submit again.</p>
          <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
            {jockeyApplication.rejectionReason || 'Reject reason is not available.'}
          </div>
          <button className="primary-button owner-hero-action mt-5" type="button" onClick={onBecomeJockey}>
            Apply Again as Jockey
          </button>
        </section>
      )}

      {accountType === 'JOCKEY' && jockeyStatus === 'APPROVED' && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Jockey Approved</p>
            <h2>Your Jockey application has been approved.</h2>
            <p>Sign out and sign in again so the app can load your new Jockey role and dashboard.</p>
          </div>
        </section>
      )}

      {accountType === 'OWNER' && status === 'PENDING' && (
        <section className="owner-panel warning-owner-panel">
          <p className="eyebrow">Pending Approval</p>
          <h2>Your application has been submitted successfully and is waiting for administrator approval.</h2>
          <button
            className="outline-button mt-5"
            type="button"
            onClick={() => setShowOwnerApplicationDetail((value) => !value)}
          >
            {showOwnerApplicationDetail ? 'Hide Submitted Application' : 'View Submitted Application'}
          </button>
        </section>
      )}

      {accountType === 'OWNER' && status === 'PENDING' && showOwnerApplicationDetail && (
        <OwnerApplicationDetail application={ownerApplication} />
      )}

      {accountType === 'OWNER' && status === 'REJECTED' && (
        <section className="owner-panel">
          <p className="eyebrow">Rejected</p>
          <h2>Your Owner application has been rejected.</h2>
          <p>Please review the reason below and submit a new application.</p>
          <div className="mt-4 rounded-2xl border border-danger/20 bg-danger-bg p-4 font-bold text-danger">
            {ownerApplication.rejectReason || 'Reject reason is not available.'}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="primary-button owner-hero-action" type="button" onClick={onOpenAgain}>
              Apply Again
            </button>
            <button
              className="outline-button"
              type="button"
              onClick={() => setShowOwnerApplicationDetail((value) => !value)}
            >
              {showOwnerApplicationDetail ? 'Hide Application' : 'View Application'}
            </button>
          </div>
        </section>
      )}

      {accountType === 'OWNER' && status === 'REJECTED' && showOwnerApplicationDetail && (
        <OwnerApplicationDetail application={ownerApplication} />
      )}

      {accountType === 'OWNER' && status === 'APPROVED' && (
        <section className="owner-panel hero-owner-panel">
          <div>
            <p className="eyebrow">Approved</p>
            <h2>Congratulations! Your Owner application has been approved.</h2>
            <p>You can now register horses, manage your horse stable, and prepare race registrations.</p>
          </div>
          <div className="owner-shortcut-actions">
            <button className="primary-button owner-hero-action" type="button">Register Horse</button>
            <button className="outline-button owner-hero-action" type="button">My Horses</button>
            <button className="outline-button owner-hero-action" type="button">Race Registration</button>
          </div>
        </section>
      )}
    </section>
  );
}

export default function UserPanel({ user, onLogout }) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('vnp_TxnRef') || params.has('vnp_SecureHash')) return 'wallet';
    return params.get('section') || 'dashboard';
  });
  const [ownerApplication, setOwnerApplication] = useState(null);
  const [jockeyApplication, setJockeyApplication] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isJockeyFormOpen, setIsJockeyFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ownerFormError, setOwnerFormError] = useState('');
  const [jockeyFormError, setJockeyFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingJockey, setIsSubmittingJockey] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [races, setRaces] = useState([]);
  const [bettingEvents, setBettingEvents] = useState([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  const profileName = user?.fullName || user?.email || 'Spectator';
  const role = getUserRole(user) || 'SPECTATOR';
  const accountType = String(user?.accountType || role).toUpperCase();
  const visibleNavItems = useMemo(
    () => navItems.filter((item) => !item.accountTypes || item.accountTypes.includes(accountType)),
    [accountType]
  );

  const notifications = useMemo(() => {
    if (ownerApplication?.status === 'APPROVED') {
      return ['Your Owner application has been approved.'];
    }

    if (ownerApplication?.status === 'REJECTED') {
      return [`Your Owner application has been rejected. Reason: ${ownerApplication.rejectReason || 'No reason provided.'}`];
    }

    if (ownerApplication?.status === 'PENDING') {
      return ['Your Owner application is waiting for administrator approval.'];
    }

    if (jockeyApplication?.verificationStatus === 'PENDING') {
      return ['Your Jockey application is waiting for administrator approval.'];
    }

    if (getKycStatus(kyc) === 'IN_REVIEW') {
      return ['Didit is reviewing your identity verification.'];
    }

    if (getKycStatus(kyc) === 'REJECTED') {
      return [`Your KYC has been rejected. Reason: ${kyc.rejectionReason || 'No reason provided.'}`];
    }

    return [t('spectatorNoNotifications')];
  }, [ownerApplication, jockeyApplication, kyc, t]);

  async function loadOwnerApplication() {
    setIsLoadingApplication(true);
    setError('');

    try {
      const [ownerResult, jockeyResult, kycResult] = await Promise.allSettled([
        accountType === 'OWNER' ? getMyOwnerApplication(user) : Promise.resolve(null),
        accountType === 'JOCKEY' ? getMyJockeyVerification() : Promise.resolve(null),
        getMyKyc()
      ]);

      if (ownerResult.status === 'fulfilled') {
        setOwnerApplication(ownerResult.value);
      } else {
        setOwnerApplication(null);
      }

      if (jockeyResult.status === 'fulfilled') {
        setJockeyApplication(jockeyResult.value);
      } else if (jockeyResult.reason?.status === 404) {
        setJockeyApplication(null);
      } else {
        throw jockeyResult.reason;
      }

      if (kycResult.status === 'fulfilled') {
        setKyc(kycResult.value);
      } else {
        setKyc(null);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải trạng thái Owner application.');
    } finally {
      setIsLoadingApplication(false);
    }
  }

  useEffect(() => {
    loadOwnerApplication();
  }, [user?.userID, user?.id, accountType]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoadingDashboard(true);
      setDashboardError('');
      const [raceResult, bettingResult] = await Promise.allSettled([
        getRaces(),
        accountType === 'SPECTATOR' ? getBettingEvents() : Promise.resolve([])
      ]);
      if (cancelled) return;

      setRaces(raceResult.status === 'fulfilled' && Array.isArray(raceResult.value) ? raceResult.value : []);
      setBettingEvents(bettingResult.status === 'fulfilled' && Array.isArray(bettingResult.value) ? bettingResult.value : []);
      if (raceResult.status === 'rejected') {
        setDashboardError(raceResult.reason?.message || t('spectatorRaceDataError'));
      } else if (bettingResult.status === 'rejected') {
        setDashboardError(bettingResult.reason?.message || t('spectatorBettingDataError'));
      }
      setIsLoadingDashboard(false);
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [accountType]);

  async function handleSubmitApplication(values) {
    setIsSubmitting(true);
    setOwnerFormError('');
    setMessage('');

    try {
      const application = await submitOwnerApplication(user, values);
      setOwnerApplication(application);
      setIsFormOpen(false);
      setActiveSection('profile');
      setMessage('Your Owner Application has been submitted and is pending Admin review.');
    } catch (err) {
      setOwnerFormError(err.message || 'Không thể gửi Owner application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBecomeJockey() {
    if (jockeyApplication?.verificationStatus === 'PENDING' || jockeyApplication?.verificationStatus === 'APPROVED') {
      setActiveSection('profile');
      return;
    }

    setIsJockeyFormOpen(true);
  }

  async function handleSubmitJockeyApplication(values) {
    setIsSubmittingJockey(true);
    setJockeyFormError('');
    setMessage('');

    try {
      const { kyc: _kycValues, ...jockeyValues } = values;
      const application = jockeyApplication?.verificationStatus === 'REJECTED'
        ? await resubmitJockeyVerification(jockeyApplication.verificationId, jockeyValues)
        : await submitJockeyVerification(jockeyValues);

      setJockeyApplication(application);
      setIsJockeyFormOpen(false);
      setActiveSection('profile');
      setMessage('Jockey application submitted successfully. Please wait for admin approval, then sign in again after approval.');
    } catch (err) {
      setJockeyFormError(err.message || 'Cannot submit Jockey application.');
    } finally {
      setIsSubmittingJockey(false);
    }
  }

  function renderSection() {
    if (activeSection === 'dashboard') {
      return (
        <DashboardHome
          accountType={accountType}
          onGoProfile={() => setActiveSection('profile')}
          onNavigate={setActiveSection}
          races={races}
          bettingEvents={bettingEvents}
          isLoading={isLoadingDashboard}
          error={dashboardError}
        />
      );
    }

    if (activeSection === 'profile') {
      return (
        <ProfileSection
          user={user}
          ownerApplication={ownerApplication}
          jockeyApplication={jockeyApplication}
          kyc={kyc}
          isLoading={isLoadingApplication}
          onOpenApplication={() => setIsFormOpen(true)}
          onOpenAgain={() => setIsFormOpen(true)}
          onBecomeJockey={handleBecomeJockey}
          onOpenKyc={() => setActiveSection('wallet')}
        />
      );
    }

    if (activeSection === 'horses') {
      return <PlaceholderSection title={t('spectatorNavHorses')} message={t('spectatorNoRaceData', { name: t('spectatorNavHorses').toLowerCase() })} icon="🐎" />;
    }

    if (activeSection === 'races') {
      return <RaceListSection title={t('spectatorNavRaces')} races={races} isLoading={isLoadingDashboard} />;
    }

    if (activeSection === 'betting' && accountType === 'SPECTATOR') {
      return <BettingPanel />;
    }

    if (activeSection === 'wallet') {
      return <WalletTransferPanel currentUser={user} role={accountType} />;
    }

    return <RaceListSection title={t('spectatorNavResults')} races={races} isLoading={isLoadingDashboard} resultsOnly />;
  }

  return (
    <main className="owner-shell">
      <aside className="owner-sidebar">
        <div className="owner-brand">
          <div className="owner-logo">🏇</div>
          <div>
            <strong>Horse Racing</strong>
            <span>{accountType === 'SPECTATOR' ? t('spectatorPortalAccount') : `${formatDisplayLabel(accountType)} Account`}</span>
          </div>
        </div>

        <nav className="owner-nav" aria-label={`${formatDisplayLabel(accountType)} navigation`}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.key;
            const label = item.labelKey ? t(item.labelKey) : item.label;

            return (
              <button
                key={item.key}
                className={active ? 'owner-nav-item active' : 'owner-nav-item'}
                type="button"
                onClick={() => setActiveSection(item.key)}
              >
                <span><Icon size={16} /></span>
                {label}
              </button>
            );
          })}
        </nav>

        <div className="owner-profile-card">
          <span>{t('spectatorSignedInAs')}</span>
          <strong>{profileName}</strong>
          <small>{formatDisplayLabel(accountType)}</small>
        </div>

        <button className="owner-logout" type="button" onClick={onLogout}>
          {t('spectatorSignOut')}
        </button>
      </aside>

      <section className="owner-main">
        <header className="owner-topbar">
          <div>
            <p className="eyebrow">Horse Racing</p>
            <h1>{activeSection === 'profile' ? t('spectatorProfile') : accountType === 'SPECTATOR' ? t('spectatorDashboard') : `${formatDisplayLabel(accountType)} Dashboard`}</h1>
            <p>{accountType === 'SPECTATOR'
              ? t('spectatorHeaderDesc')
              : `Complete your ${formatDisplayLabel(accountType)} application to unlock professional features.`}</p>
          </div>

          <div className="relative flex flex-wrap items-center justify-end gap-3">
            <LanguageToggle />
            <button
              className="refresh-button relative"
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <Bell size={17} />
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-14 z-20 w-80 rounded-2xl border border-brown-700/10 bg-white p-4 shadow-[0_18px_50px_rgba(43,23,16,0.18)]">
                <strong className="block text-brown-900">{t('spectatorNotifications')}</strong>
                <div className="mt-3 grid gap-2">
                  {notifications.map((item) => (
                    <p className="rounded-xl bg-cream-200/60 px-3 py-2 text-sm font-bold text-brown-700" key={item}>{item}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {error && <div className="admin-alert error" role="alert">{error}</div>}
        {message && <div className="admin-alert success" role="status">{message}</div>}

        {renderSection()}
      </section>

      {accountType === 'OWNER' && isFormOpen && (
        <OwnerApplicationForm
          user={user}
          application={ownerApplication}
          kyc={kyc}
          formError={ownerFormError}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setOwnerFormError('');
            setIsFormOpen(false);
          }}
          onSubmit={handleSubmitApplication}
        />
      )}

      {accountType === 'JOCKEY' && isJockeyFormOpen && (
        <JockeyApplicationForm
          user={user}
          application={jockeyApplication}
          kyc={kyc}
          mode={jockeyApplication?.verificationStatus === 'REJECTED' ? 'resubmit' : 'submit'}
          formError={jockeyFormError}
          isSubmitting={isSubmittingJockey}
          onCancel={() => {
            setJockeyFormError('');
            setIsJockeyFormOpen(false);
          }}
          onSubmit={handleSubmitJockeyApplication}
        />
      )}

    </main>
  );
}
