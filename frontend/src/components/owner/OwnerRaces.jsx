import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Flag,
  HeartPulse,
  MapPin,
  Medal,
  RefreshCw,
  Search,
  Trophy,
  Users
} from 'lucide-react';
import { getRaceResults } from '../../services/eventService';
import { getOwnerHorseById, getOwnerRaces, getPublicJockeyProfile, markOwnerPrizeDistributionPaid } from '../../services/ownerService';
import { useLanguage } from '../../context/LanguageContext';
import { formatDisplayLabel, getUserId } from '../../lib';
import RaceResultLeaderboard from '../admin/events/race-entry/RaceResultLeaderboard';

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function getRaceImageUrl(race) {
  return String(race?.trackImageUrl || race?.trackImagePath || '').trim();
}

function getRaceStatus(race) {
  return race?.raceStatus || race?.status || 'N/A';
}

function getRaceName(race) {
  return race?.raceName || race?.name || `Race #${race?.raceId || ''}`;
}

function getTotalPrize(results) {
  return results.reduce((sum, result) => sum + Number(result.prizeMoney || result.totalPrize || 0), 0);
}

function formatDateTime(value, t, language = 'vi') {
  if (!value) return typeof t === 'function' ? t('notUpdated') : 'N/A';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatDate(value, t, language = 'vi') {
  if (!value) return typeof t === 'function' ? t('notUpdated') : 'N/A';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

function calculateRate(part, total) {
  const totalValue = Number(total);
  if (!totalValue) return null;
  return (Number(part || 0) / totalValue) * 100;
}

function formatPercent(value, t) {
  const number = Number(value);
  if (!Number.isFinite(number)) return t('notUpdated');
  return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function getHorsePerformance(horse) {
  const performance = horse?.performance || {};
  const totalRaces = Number(performance.totalRaces || 0);
  const top1 = Number(performance.top1Count || 0);
  const top2 = Number(performance.top2Count || 0);
  const top3 = Number(performance.top3Count || 0);
  const podium = top1 + top2 + top3;

  return {
    totalRaces,
    top1,
    top2,
    top3,
    winRate: calculateRate(top1, totalRaces),
    top3Rate: calculateRate(podium, totalRaces),
    violationCount: Number(performance.violationCount || 0),
    disqualifiedCount: Number(performance.disqualifiedCount || 0)
  };
}

function getJockeyPerformance(jockey) {
  const performance = jockey?.performance || {};
  const totalRaces = Number(performance.totalRaces ?? jockey?.totalRaces ?? 0);
  const top1 = Number(performance.top1Count ?? jockey?.totalWins ?? 0);
  const top2 = Number(performance.top2Count || 0);
  const top3 = Number(performance.top3Count || 0);
  const podium = top1 + top2 + top3;

  return {
    totalRaces,
    top1,
    top2,
    top3,
    winRate: performance.winRate ?? calculateRate(top1, totalRaces),
    top3Rate: performance.top3Rate ?? calculateRate(podium, totalRaces),
    violationCount: Number(performance.violationCount || 0),
    disqualifiedCount: Number(performance.disqualifiedCount || 0)
  };
}

function statusClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'completed';
  if (normalized === 'PENDING_REVIEW') return 'pending_review';
  if (normalized === 'IN_PROGRESS') return 'in_progress';
  if (normalized === 'READY') return 'ready';
  if (normalized === 'CANCELLED') return 'cancelled';
  return 'open_for_registration';
}

const OWNER_RACE_FILTERS = ['ALL', 'UPCOMING', 'IN_PROGRESS', 'PENDING_REVIEW', 'COMPLETED'];

export default function OwnerRaces({ currentUser }) {
  const { language, t } = useLanguage();
  const currentOwnerId = getUserId(currentUser);
  const [races, setRaces] = useState([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [resultRace, setResultRace] = useState(null);
  const [results, setResults] = useState([]);
  const [resultError, setResultError] = useState('');
  const [isResultLoading, setIsResultLoading] = useState(false);
  const [markingPrizeDistributionId, setMarkingPrizeDistributionId] = useState(null);
  const [detailRace, setDetailRace] = useState(null);
  const [detailHorse, setDetailHorse] = useState(null);
  const [detailJockey, setDetailJockey] = useState(null);
  const [detailError, setDetailError] = useState('');
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const copy = {
    eyebrow: language === 'vi' ? 'Race của tôi' : 'Your races',
    title: language === 'vi' ? 'Race đã được phân công' : 'Assigned race entries',
    desc: language === 'vi'
      ? 'Theo dõi các Race mà Registration của bạn đã được Admin xếp RaceEntry và xem kết quả chính thức khi Race hoàn tất.'
      : 'Track races where your registration has been assigned as a RaceEntry and view official results after completion.',
    search: language === 'vi' ? 'Tìm theo Tournament, Race, Horse, Jockey...' : 'Search Tournament, Race, Horse, Jockey...',
    emptyTitle: language === 'vi' ? 'Chưa có Race được phân công' : 'No assigned races yet',
    emptyDesc: language === 'vi'
      ? 'Sau khi Admin duyệt Registration và phân công RaceEntry, Race sẽ xuất hiện tại đây.'
      : 'After Admin approves your Registration and assigns a RaceEntry, races will appear here.',
    noResult: language === 'vi' ? 'Chưa có kết quả chính thức' : 'No official result yet',
    viewResult: language === 'vi' ? 'Xem kết quả' : 'View result',
    officialResult: language === 'vi' ? 'Kết quả chính thức' : 'Official result',
    loadError: language === 'vi' ? 'Không thể tải danh sách Race của bạn.' : 'Unable to load your races.',
    resultLoadError: language === 'vi' ? 'Không thể tải kết quả Race.' : 'Unable to load race results.',
    markPaid: language === 'vi' ? 'Đánh dấu đã nhận giải' : 'Mark payout paid',
    notYourPayout: language === 'vi' ? 'Không phải phần giải của bạn' : 'Not your payout',
    markPaidError: language === 'vi' ? 'Không thể cập nhật trạng thái nhận giải.' : 'Unable to update payout status.',
    retry: language === 'vi' ? 'Tải lại' : 'Retry',
    raceEntry: 'RaceEntry',
    registeredHorse: language === 'vi' ? 'Horse đã đăng ký' : 'Registered horse',
    raceTime: language === 'vi' ? 'Lịch Race' : 'Race schedule',
    stall: language === 'vi' ? 'Chuồng xuất phát' : 'Starting stall',
    raceDetails: language === 'vi' ? 'Chi tiết Race' : 'Race details',
    horseDetails: language === 'vi' ? 'Chi tiết Horse' : 'Horse details',
    jockeyDetails: language === 'vi' ? 'Chi tiết Jockey' : 'Jockey details',
    totalAssigned: language === 'vi' ? 'RaceEntry đã phân công' : 'Assigned RaceEntries',
    activeRaces: language === 'vi' ? 'Đang theo dõi' : 'In watchlist',
    completedRaces: language === 'vi' ? 'Đã hoàn tất' : 'Completed',
    resultsReady: language === 'vi' ? 'Có kết quả' : 'Results ready',
    filterAll: language === 'vi' ? 'Tất cả' : 'All',
    filterUpcoming: language === 'vi' ? 'Sắp chạy' : 'Upcoming',
    filterInProgress: language === 'vi' ? 'Đang chạy' : 'In progress',
    filterPendingReview: language === 'vi' ? 'Chờ duyệt kết quả' : 'Pending review',
    filterCompleted: language === 'vi' ? 'Đã hoàn tất' : 'Completed',
    showing: language === 'vi' ? 'Đang hiển thị' : 'Showing'
  };

  async function loadRaces() {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await getOwnerRaces();
      setRaces(Array.isArray(data) ? data : []);
    } catch (error) {
      setLoadError(getErrorText(error, copy.loadError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRaces();
  }, []);

  const raceStats = useMemo(() => {
    const activeStatuses = new Set(['READY', 'IN_PROGRESS', 'PENDING_REVIEW']);
    return {
      total: races.length,
      active: races.filter((race) => activeStatuses.has(String(getRaceStatus(race)).toUpperCase())).length,
      completed: races.filter((race) => String(getRaceStatus(race)).toUpperCase() === 'COMPLETED').length,
      resultReady: races.filter((race) => race.officialResultAvailable).length
    };
  }, [races]);

  const filteredRaces = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return races.filter((race) => {
      const status = String(getRaceStatus(race)).toUpperCase();
      const matchesStatus = statusFilter === 'ALL'
        || (statusFilter === 'UPCOMING' && !['COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'PENDING_REVIEW'].includes(status))
        || status === statusFilter;

      if (!matchesStatus) return false;
      if (!needle) return true;

      return [
      race.tournamentName,
      race.raceName,
      race.trackName,
      race.horseName,
      race.jockeyName,
      race.registrationNo
      ].some((value) => String(value || '').toLowerCase().includes(needle));
    });
  }, [query, races, statusFilter]);

  async function openResults(race) {
    setResultRace(race);
    setResults([]);
    setResultError('');
    setIsResultLoading(true);
    try {
      const data = await getRaceResults(race.raceId);
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setResultError(getErrorText(error, copy.resultLoadError));
    } finally {
      setIsResultLoading(false);
    }
  }

  async function openHorseDetails(event, race) {
    event?.stopPropagation();
    if (!race?.horseId) return;

    setDetailHorse(null);
    setDetailJockey(null);
    setDetailError('');
    setIsDetailLoading(true);

    try {
      const horse = await getOwnerHorseById(race.horseId);
      setDetailHorse(horse);
    } catch (error) {
      setDetailError(getErrorText(error, language === 'vi' ? 'Không thể tải chi tiết Horse.' : 'Unable to load horse details.'));
      setDetailHorse({ horseId: race.horseId, horseName: race.horseName });
    } finally {
      setIsDetailLoading(false);
    }
  }

  async function openJockeyDetails(event, race) {
    event?.stopPropagation();
    if (!race?.jockeyId) return;

    setDetailHorse(null);
    setDetailJockey(null);
    setDetailError('');
    setIsDetailLoading(true);

    try {
      const jockey = await getPublicJockeyProfile(race.jockeyId);
      setDetailJockey(jockey);
    } catch (error) {
      setDetailError(getErrorText(error, language === 'vi' ? 'Không thể tải chi tiết Jockey.' : 'Unable to load jockey details.'));
      setDetailJockey({ jockeyId: race.jockeyId, fullName: race.jockeyName });
    } finally {
      setIsDetailLoading(false);
    }
  }

  function closeEntityDetail() {
    setDetailHorse(null);
    setDetailJockey(null);
    setDetailError('');
    setIsDetailLoading(false);
  }

  async function handleMarkOwnerPayoutPaid(result) {
    const prizeDistributionId = result?.prizeDistributionId;
    if (!prizeDistributionId || !canMarkOwnerPayoutPaid(result)) return;

    setMarkingPrizeDistributionId(prizeDistributionId);
    setResultError('');

    try {
      await markOwnerPrizeDistributionPaid(prizeDistributionId);
      setResults((current) => current.map((item) => (
        item.prizeDistributionId === prizeDistributionId
          ? { ...item, distributionStatus: 'PAID' }
          : item
      )));
    } catch (error) {
      setResultError(getErrorText(error, copy.markPaidError));
    } finally {
      setMarkingPrizeDistributionId(null);
    }
  }

  function canMarkOwnerPayoutPaid(result) {
    if (!currentOwnerId) return false;
    return Number(result?.ownerId) === Number(currentOwnerId);
  }

  return (
    <section className="owner-stack owner-races-page owner-races-owner-page">
      <div className="owner-races-command-center">
        <div className="owner-races-hero-copy">
          <span className="owner-races-kicker"><Medal size={15} /> {copy.eyebrow}</span>
          <h2>{copy.title}</h2>
          <p>{copy.desc}</p>
        </div>
        <button className="owner-races-refresh-button" type="button" onClick={loadRaces} disabled={isLoading}>
          <RefreshCw size={16} /> {isLoading ? `${t('loading')}...` : copy.retry}
        </button>
      </div>

      <section className="owner-races-summary-grid" aria-label="Owner race summary">
        <article>
          <span><Flag size={17} /> {copy.totalAssigned}</span>
          <strong>{raceStats.total}</strong>
          <small>{copy.raceEntry}</small>
        </article>
        <article>
          <span><Activity size={17} /> {copy.activeRaces}</span>
          <strong>{raceStats.active}</strong>
          <small>READY / IN_PROGRESS</small>
        </article>
        <article>
          <span><CheckCircle2 size={17} /> {copy.completedRaces}</span>
          <strong>{raceStats.completed}</strong>
          <small>COMPLETED</small>
        </article>
        <article>
          <span><Trophy size={17} /> {copy.resultsReady}</span>
          <strong>{raceStats.resultReady}</strong>
          <small>{copy.officialResult}</small>
        </article>
      </section>

      <section className="owner-races-control-panel">
        <div className="owner-races-control-header">
          <div>
            <h3>{language === 'vi' ? 'Danh sách RaceEntry' : 'RaceEntry portfolio'}</h3>
            <p>{copy.showing} {filteredRaces.length} / {races.length} Race</p>
          </div>
          <span className="owner-count-pill">{filteredRaces.length} / {races.length} Race</span>
        </div>
        <div className="owner-races-filter-row">
          <label className="owner-races-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
          </label>
          <div className="owner-races-filter-pills" aria-label="Race status filters">
            {OWNER_RACE_FILTERS.map((filter) => {
              const label = {
                ALL: copy.filterAll,
                UPCOMING: copy.filterUpcoming,
                IN_PROGRESS: copy.filterInProgress,
                PENDING_REVIEW: copy.filterPendingReview,
                COMPLETED: copy.filterCompleted
              }[filter];
              return (
                <button
                  key={filter}
                  type="button"
                  className={statusFilter === filter ? 'active' : ''}
                  onClick={() => setStatusFilter(filter)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {loadError && (
        <div className="admin-alert error" role="alert">
          {loadError}
          <button type="button" className="table-button" onClick={loadRaces}>{copy.retry}</button>
        </div>
      )}

      {isLoading ? (
        <section className="owner-races-state-card">
          <RefreshCw size={22} />
          <h3>{t('loading')}...</h3>
          <p>{language === 'vi' ? 'Đang đồng bộ RaceEntry của bạn.' : 'Syncing your assigned RaceEntries.'}</p>
        </section>
      ) : filteredRaces.length === 0 ? (
        <section className="owner-races-state-card">
          <Trophy size={28} />
          <h3>{copy.emptyTitle}</h3>
          <p>{copy.emptyDesc}</p>
        </section>
      ) : (
        <div className="owner-races-list-shell">
          <div className="owner-races-list-head" aria-hidden="true">
            <span>{language === 'vi' ? 'Race' : 'Race'}</span>
            <span>{language === 'vi' ? 'Thông tin RaceEntry' : 'RaceEntry details'}</span>
            <span>{language === 'vi' ? 'Lịch & người tham gia' : 'Schedule & participants'}</span>
            <span>Status</span>
            <span>{t('actions')}</span>
          </div>
          <div className="owner-races-list">
          {filteredRaces.map((race, index) => {
            const imageUrl = getRaceImageUrl(race);
            const status = getRaceStatus(race);
            const canViewResult = Boolean(race.officialResultAvailable);
            return (
              <article
                className="owner-race-card owner-race-card-clickable"
                key={race.raceEntryId || `${race.raceId}-${race.registrationId}`}
                role="button"
                tabIndex={0}
                onClick={() => setDetailRace(race)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setDetailRace(race);
                  }
                }}
              >
                <div className="owner-race-card-media">
                  <div className={`owner-race-card-image ${imageUrl ? 'has-image' : ''}`}>
                    {imageUrl ? <img src={imageUrl} alt={race.trackName || getRaceName(race)} /> : <Flag size={26} />}
                  </div>
                  <span className="owner-race-index-pill">#{index + 1}</span>
                </div>
                <div className="owner-race-card-main">
                  <p>{race.tournamentName || `Tournament #${race.tournamentId}`}</p>
                  <h3>{getRaceName(race)}</h3>
                  <span><MapPin size={14} /> {race.trackName || t('notUpdated')}</span>
                  <div className="owner-race-card-chips">
                    <span>{copy.raceEntry} #{race.raceEntryId || '-'}</span>
                    <span>{race.registrationNo || `Registration #${race.registrationId || '-'}`}</span>
                  </div>
                </div>
                <div className="owner-race-card-info">
                  <span><CalendarDays size={15} /> {copy.raceTime} <strong>{formatDateTime(race.raceStartTime, t, language)}</strong></span>
                  <span>
                    <Users size={15} /> {copy.registeredHorse}
                    <button type="button" className="owner-race-inline-link" onClick={(event) => openHorseDetails(event, race)}>
                      {race.horseName || t('notUpdated')}
                    </button>
                  </span>
                  <span>
                    <Medal size={15} /> Jockey
                    <button type="button" className="owner-race-inline-link" onClick={(event) => openJockeyDetails(event, race)}>
                      {race.jockeyName || t('notUpdated')}
                    </button>
                  </span>
                  <span><Clock3 size={15} /> {copy.stall} <strong>{race.startingStall || '-'}</strong></span>
                </div>
                <div className="owner-race-card-state">
                  <span className={`status-badge ${statusClass(status)}`}>{formatDisplayLabel(status)}</span>
                  <small>{copy.raceEntry}: {formatDisplayLabel(race.raceEntryStatus || 'ASSIGNED')}</small>
                </div>
                <div className="owner-race-card-actions">
                  <button
                    type="button"
                    className="primary-button compact-primary"
                    onClick={(event) => {
                      event.stopPropagation();
                      openResults(race);
                    }}
                    disabled={!canViewResult}
                  >
                    <Eye size={15} /> {canViewResult ? copy.viewResult : copy.noResult}
                  </button>
                </div>
              </article>
            );
          })}
          </div>
        </div>
      )}

      {detailRace && (
        <div className="owner-race-info-backdrop" role="presentation" onClick={() => setDetailRace(null)}>
          <section className="owner-race-info-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="owner-race-info-header">
              <div>
                <p className="eyebrow">{copy.raceDetails}</p>
                <h3>{getRaceName(detailRace)}</h3>
                <span><MapPin size={15} /> {detailRace.trackName || t('notUpdated')}</span>
              </div>
              <button type="button" className="drawer-close-button" onClick={() => setDetailRace(null)} aria-label={t('close')}>×</button>
            </div>
            <div className="owner-race-info-grid">
              <article><CalendarDays size={18} /><span>{copy.raceTime}</span><strong>{formatDateTime(detailRace.raceStartTime, t, language)}</strong></article>
              <article><Clock3 size={18} /><span>{language === 'vi' ? 'Kết thúc' : 'Ends'}</span><strong>{formatDateTime(detailRace.raceEndTime, t, language)}</strong></article>
              <article><Flag size={18} /><span>{language === 'vi' ? 'Cự ly' : 'Distance'}</span><strong>{detailRace.distance ? `${detailRace.distance}m` : t('notUpdated')}</strong></article>
              <article><Users size={18} /><span>{language === 'vi' ? 'Sức chứa' : 'Capacity'}</span><strong>{detailRace.maxRunners || t('notUpdated')}</strong></article>
              <article><Medal size={18} /><span>Status</span><strong>{formatDisplayLabel(getRaceStatus(detailRace))}</strong></article>
              <article><Trophy size={18} /><span>{copy.raceEntry}</span><strong>{formatDisplayLabel(detailRace.raceEntryStatus || 'ASSIGNED')}</strong></article>
            </div>
            <div className="owner-race-info-participants">
              <button type="button" onClick={(event) => openHorseDetails(event, detailRace)}>
                <HeartPulse size={18} />
                <span>{copy.horseDetails}</span>
                <strong>{detailRace.horseName || t('notUpdated')}</strong>
              </button>
              <button type="button" onClick={(event) => openJockeyDetails(event, detailRace)}>
                <Medal size={18} />
                <span>{copy.jockeyDetails}</span>
                <strong>{detailRace.jockeyName || t('notUpdated')}</strong>
              </button>
            </div>
          </section>
        </div>
      )}

      {(detailHorse || detailJockey || isDetailLoading || detailError) && (
        <div className="owner-race-info-backdrop" role="presentation" onClick={closeEntityDetail}>
          <section className="owner-race-info-modal owner-entity-info-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="owner-race-info-header">
              <div>
                <p className="eyebrow">{detailHorse ? copy.horseDetails : copy.jockeyDetails}</p>
                <h3>{detailHorse?.horseName || detailJockey?.fullName || detailJockey?.jockeyName || t('loading')}</h3>
                <span>{detailHorse ? formatDisplayLabel(detailHorse.status) : formatDisplayLabel(detailJockey?.verificationStatus || detailJockey?.status)}</span>
              </div>
              <button type="button" className="drawer-close-button" onClick={closeEntityDetail} aria-label={t('close')}>×</button>
            </div>
            {isDetailLoading ? (
              <div className="owner-races-state-card compact"><RefreshCw size={22} /><h3>{t('loading')}...</h3></div>
            ) : (
              <>
                {detailError && <div className="admin-alert error" role="alert">{detailError}</div>}
                {detailHorse && (
                  (() => {
                    const performance = getHorsePerformance(detailHorse);
                    return (
                      <div className="owner-race-info-grid">
                        <article><Trophy size={18} /><span>{t('ownerRaceTotalRace')}</span><strong>{performance.totalRaces}</strong></article>
                        <article><Medal size={18} /><span>{t('ownerRaceWins')}</span><strong>{performance.top1}</strong></article>
                        <article><CheckCircle2 size={18} /><span>{t('ownerRaceTop3Rate')}</span><strong>{formatPercent(performance.top3Rate, t)}</strong></article>
                        <article><Activity size={18} /><span>{t('ownerRaceViolation')}</span><strong>{performance.violationCount} / DQ {performance.disqualifiedCount}</strong></article>
                        <article><HeartPulse size={18} /><span>{language === 'vi' ? 'Giống' : 'Breeding'}</span><strong>{detailHorse.breeding || t('notUpdated')}</strong></article>
                        <article><CalendarDays size={18} /><span>{language === 'vi' ? 'Ngày sinh' : 'Birth date'}</span><strong>{formatDate(detailHorse.dayOfBirth, t, language)}</strong></article>
                        <article><Users size={18} /><span>{language === 'vi' ? 'Giới tính' : 'Sex'}</span><strong>{formatDisplayLabel(detailHorse.sex)}</strong></article>
                        <article><Activity size={18} /><span>{language === 'vi' ? 'Cân nặng' : 'Weight'}</span><strong>{detailHorse.weight ? `${detailHorse.weight} kg` : t('notUpdated')}</strong></article>
                        <article><Flag size={18} /><span>{language === 'vi' ? 'Màu lông' : 'Colour'}</span><strong>{detailHorse.colour || t('notUpdated')}</strong></article>
                        <article><CheckCircle2 size={18} /><span>{language === 'vi' ? 'Hạn sức khỏe' : 'Health expiry'}</span><strong>{formatDate(detailHorse.healthCertExpiry, t, language)}</strong></article>
                      </div>
                    );
                  })()
                )}
                {detailJockey && (
                  (() => {
                    const performance = getJockeyPerformance(detailJockey);
                    return (
                      <div className="owner-race-info-grid">
                        <article><Medal size={18} /><span>{language === 'vi' ? 'Tên Jockey' : 'Jockey name'}</span><strong>{detailJockey.fullName || detailJockey.jockeyName || t('notUpdated')}</strong></article>
                        <article><Trophy size={18} /><span>{t('ownerRaceTotalRace')}</span><strong>{performance.totalRaces}</strong></article>
                        <article><Medal size={18} /><span>{t('ownerRaceWins')}</span><strong>{performance.top1}</strong></article>
                        <article><Trophy size={18} /><span>Top 1 / 2 / 3</span><strong>{performance.top1} / {performance.top2} / {performance.top3}</strong></article>
                        <article><CheckCircle2 size={18} /><span>{t('ownerRaceWinRate')}</span><strong>{formatPercent(performance.winRate, t)}</strong></article>
                        <article><CheckCircle2 size={18} /><span>{t('ownerRaceTop3Rate')}</span><strong>{formatPercent(performance.top3Rate, t)}</strong></article>
                        <article><Activity size={18} /><span>{t('ownerRaceViolation')}</span><strong>{performance.violationCount} / DQ {performance.disqualifiedCount}</strong></article>
                        <article><Activity size={18} /><span>{language === 'vi' ? 'Cân nặng' : 'Weight'}</span><strong>{detailJockey.weight ? `${detailJockey.weight} kg` : t('notUpdated')}</strong></article>
                        <article><Flag size={18} /><span>{language === 'vi' ? 'Giấy phép' : 'Licence'}</span><strong>{detailJockey.licenceType || detailJockey.licenseNo || t('notUpdated')}</strong></article>
                        <article><CheckCircle2 size={18} /><span>Status</span><strong>{formatDisplayLabel(detailJockey.verificationStatus || detailJockey.status)}</strong></article>
                      </div>
                    );
                  })()
                )}
                {detailJockey?.biography && (
                  <p className="owner-entity-biography">{detailJockey.biography}</p>
                )}
              </>
            )}
          </section>
        </div>
      )}

      {resultRace && (
        <div className="owner-race-result-backdrop" role="presentation" onClick={() => setResultRace(null)}>
          <section className="owner-race-result-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            {isResultLoading ? (
              <div className="owner-races-empty">
                <RefreshCw size={22} />
                <h3>{t('loading')}...</h3>
              </div>
            ) : resultError ? (
              <div className="admin-alert error" role="alert">
                {resultError}
                <button type="button" className="table-button" onClick={() => openResults(resultRace)}>{copy.retry}</button>
              </div>
            ) : results.length === 0 ? (
              <div className="owner-races-empty">
                <Trophy size={28} />
                <h3>{copy.noResult}</h3>
                <button className="outline-button compact-button" type="button" onClick={() => setResultRace(null)}>{t('close')}</button>
              </div>
            ) : (
              <RaceResultLeaderboard
                race={{ ...resultRace, name: getRaceName(resultRace) }}
                results={results}
                totalPrize={getTotalPrize(results)}
                onClose={() => setResultRace(null)}
                onMarkOwnerPayoutPaid={handleMarkOwnerPayoutPaid}
                canMarkOwnerPayoutPaid={canMarkOwnerPayoutPaid}
                markingPrizeDistributionId={markingPrizeDistributionId}
                markOwnerPayoutLabel={copy.markPaid}
                ownerPayoutUnavailableLabel={copy.notYourPayout}
              />
            )}
          </section>
        </div>
      )}
    </section>
  );
}
