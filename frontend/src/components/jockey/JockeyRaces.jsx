import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Eye, Flag, MapPin, Medal, RefreshCw, Search, Trophy, Users } from 'lucide-react';
import { getRaceResults } from '../../services/eventService';
import { getJockeyRaces } from '../../services/jockeyService';
import { useLanguage } from '../../context/LanguageContext';
import RaceResultLeaderboard from '../admin/events/race-entry/RaceResultLeaderboard';

function getErrorText(error, fallback) {
  return error instanceof Error ? error.message || fallback : fallback;
}

function getRaceImageUrl(race) {
  return String(race?.trackImageUrl || race?.trackImagePath || '').trim();
}

function getRaceStatus(race) {
  return race?.raceStatus || race?.status || '';
}

function getRaceName(race, fallbackLabel = 'Race') {
  return race?.raceName || race?.name || `${fallbackLabel} #${race?.raceId || ''}`;
}

function getTotalPrize(results) {
  return results.reduce((sum, result) => sum + Number(result.prizeMoney || result.totalPrize || 0), 0);
}

function formatDateTime(value, t, language = 'vi') {
  if (!value) return typeof t === 'function' ? t('notUpdated') : '—';
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

function statusClass(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'COMPLETED') return 'completed';
  if (normalized === 'PENDING_REVIEW') return 'pending_review';
  if (normalized === 'IN_PROGRESS') return 'in_progress';
  if (normalized === 'READY') return 'ready';
  if (normalized === 'CANCELLED') return 'cancelled';
  return 'open_for_registration';
}

export default function JockeyRaces() {
  const { language, t } = useLanguage();
  const [races, setRaces] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [resultRace, setResultRace] = useState(null);
  const [results, setResults] = useState([]);
  const [resultError, setResultError] = useState('');
  const [isResultLoading, setIsResultLoading] = useState(false);

  const copy = {
    eyebrow: language === 'vi' ? 'Cuộc đua của tôi' : 'Your races',
    title: language === 'vi' ? 'Các lượt thi đấu được phân công' : 'Assigned race entries',
    desc: language === 'vi'
      ? 'Theo dõi các cuộc đua mà chủ ngựa đã đăng ký bạn làm nài ngựa và quản trị viên đã xếp lượt thi đấu chính thức.'
      : 'Track races where an Owner registered you as the Jockey and Admin assigned the official RaceEntry.',
    search: language === 'vi' ? 'Tìm theo giải đấu, cuộc đua, ngựa hoặc chủ ngựa...' : 'Search Tournament, Race, Horse, Owner...',
    emptyTitle: language === 'vi' ? 'Chưa có cuộc đua được phân công' : 'No assigned races yet',
    emptyDesc: language === 'vi'
      ? 'Sau khi đơn đăng ký được duyệt và phân công lượt thi đấu, cuộc đua sẽ xuất hiện tại đây.'
      : 'After a Registration is approved and assigned as a RaceEntry, races will appear here.',
    noResult: language === 'vi' ? 'Chưa có kết quả chính thức' : 'No official result yet',
    viewResult: language === 'vi' ? 'Xem kết quả' : 'View result',
    loadError: language === 'vi' ? 'Không thể tải danh sách cuộc đua của bạn.' : 'Unable to load your races.',
    resultLoadError: language === 'vi' ? 'Không thể tải kết quả cuộc đua.' : 'Unable to load race results.',
    retry: language === 'vi' ? 'Tải lại' : 'Retry',
    raceEntry: language === 'vi' ? 'Lượt thi đấu' : 'Race entry',
    registeredHorse: language === 'vi' ? 'Ngựa đã đăng ký' : 'Registered horse',
    owner: language === 'vi' ? 'Chủ ngựa' : 'Owner',
    raceTime: language === 'vi' ? 'Lịch thi đấu' : 'Race schedule',
    race: language === 'vi' ? 'Cuộc đua' : 'Race',
    tournament: language === 'vi' ? 'Giải đấu' : 'Tournament',
    stall: language === 'vi' ? 'Chuồng xuất phát' : 'Starting stall'
  };

  async function loadRaces() {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await getJockeyRaces();
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

  const filteredRaces = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return races;
    return races.filter((race) => [
      race.tournamentName,
      race.raceName,
      race.trackName,
      race.horseName,
      race.ownerName,
      race.registrationNo
    ].some((value) => String(value || '').toLowerCase().includes(needle)));
  }, [query, races]);

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

  return (
    <section className="owner-stack owner-races-page">
      <div className="owner-section-toolbar owner-races-hero">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p>{copy.desc}</p>
        </div>
        <button className="outline-button compact-button" type="button" onClick={loadRaces} disabled={isLoading}>
          <RefreshCw size={15} /> {isLoading ? `${t('loading')}...` : copy.retry}
        </button>
      </div>

      <section className="owner-panel owner-races-toolbar">
        <label className="owner-races-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
        </label>
        <span className="owner-count-pill">{filteredRaces.length} / {races.length} {copy.race.toLowerCase()}</span>
      </section>

      {loadError && (
        <div className="admin-alert error" role="alert">
          {loadError}
          <button type="button" className="table-button" onClick={loadRaces}>{copy.retry}</button>
        </div>
      )}

      {isLoading ? (
        <section className="owner-panel owner-races-empty">
          <RefreshCw size={22} />
          <h3>{t('loading')}...</h3>
        </section>
      ) : filteredRaces.length === 0 ? (
        <section className="owner-panel owner-races-empty">
          <Trophy size={28} />
          <h3>{copy.emptyTitle}</h3>
          <p>{copy.emptyDesc}</p>
        </section>
      ) : (
        <div className="owner-races-list">
          {filteredRaces.map((race) => {
            const imageUrl = getRaceImageUrl(race);
            const status = getRaceStatus(race);
            const canViewResult = Boolean(race.officialResultAvailable);
            return (
              <article className="owner-race-card" key={race.raceEntryId || `${race.raceId}-${race.registrationId}`}>
                <div className={`owner-race-card-image ${imageUrl ? 'has-image' : ''}`}>
                  {imageUrl ? <img src={imageUrl} alt={race.trackName || getRaceName(race, copy.race)} /> : <Flag size={26} />}
                </div>
                <div className="owner-race-card-main">
                  <p>{race.tournamentName || `${copy.tournament} #${race.tournamentId}`}</p>
                  <h3>{getRaceName(race, copy.race)}</h3>
                  <span><MapPin size={14} /> {race.trackName || t('notUpdated')}</span>
                </div>
                <div className="owner-race-card-info">
                  <span><CalendarDays size={15} /> {copy.raceTime} <strong>{formatDateTime(race.raceStartTime, t, language)}</strong></span>
                  <span><Users size={15} /> {copy.registeredHorse} <strong>{race.horseName || t('notUpdated')}</strong></span>
                  <span><Medal size={15} /> {copy.owner} <strong>{race.ownerName || t('notUpdated')}</strong></span>
                  <span><Flag size={15} /> {copy.stall} <strong>{race.startingStall || '-'}</strong></span>
                </div>
                <div className="owner-race-card-state">
                  <span className={`status-badge ${statusClass(status)}`}>{status ? t(`status_${String(status).toUpperCase()}`) : t('notUpdated')}</span>
                  <small>{copy.raceEntry}: {t(`status_${String(race.raceEntryStatus || 'ASSIGNED').toUpperCase()}`)}</small>
                </div>
                <div className="owner-race-card-actions">
                  <button type="button" className="primary-button compact-primary" onClick={() => openResults(race)} disabled={!canViewResult}>
                    <Eye size={15} /> {canViewResult ? copy.viewResult : copy.noResult}
                  </button>
                </div>
              </article>
            );
          })}
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
                race={{ ...resultRace, name: getRaceName(resultRace, copy.race) }}
                results={results}
                totalPrize={getTotalPrize(results)}
                onClose={() => setResultRace(null)}
              />
            )}
          </section>
        </div>
      )}
    </section>
  );
}
